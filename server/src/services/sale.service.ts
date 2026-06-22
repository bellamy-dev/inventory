import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  sellerId?: string;
  itemTypeId?: string;
  page?: number;
  limit?: number;
}

export async function createSale(data: {
  itemTypeId: string;
  quantity: number;
  buyerName?: string;
  sellerId: string;
}) {
  const stock = await prisma.stockItem.findUnique({
    where: { itemTypeId: data.itemTypeId },
  });
  if (!stock) throw new Error("Entrée de stock introuvable");

  if (stock.quantity < data.quantity) {
    throw new Error(
      `Stock insuffisant. Disponible: ${stock.quantity}, Demandé: ${data.quantity}`
    );
  }

  const item = await prisma.itemType.findUnique({
    where: { id: data.itemTypeId },
  });
  if (!item) throw new Error("Objet introuvable");

  const totalPrice = item.sellPrice * data.quantity;

  const sale = await prisma.sale.create({
    data: {
      itemTypeId: data.itemTypeId,
      quantity: data.quantity,
      unitPrice: item.sellPrice,
      totalPrice,
      buyerName: data.buyerName || null,
      sellerId: data.sellerId,
    },
    include: {
      itemType: { include: { category: true, rarity: true } },
      seller: { select: { id: true, username: true } },
    },
  });

  // Reduce stock
  await prisma.stockItem.update({
    where: { itemTypeId: data.itemTypeId },
    data: { quantity: stock.quantity - data.quantity },
  });

  return sale;
}

export async function getSales(filters: SaleFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate)
      (where.createdAt as Record<string, unknown>).gte = new Date(
        filters.startDate
      );
    if (filters.endDate)
      (where.createdAt as Record<string, unknown>).lte = new Date(
        filters.endDate + "T23:59:59.999Z"
      );
  }

  if (filters.sellerId) where.sellerId = filters.sellerId;
  if (filters.itemTypeId) where.itemTypeId = filters.itemTypeId;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        itemType: { include: { category: true, rarity: true } },
        seller: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    data: sales,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSaleStats(filters: {
  startDate?: string;
  endDate?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate)
      (where.createdAt as Record<string, unknown>).gte = new Date(
        filters.startDate
      );
    if (filters.endDate)
      (where.createdAt as Record<string, unknown>).lte = new Date(
        filters.endDate + "T23:59:59.999Z"
      );
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      itemType: { select: { buyPrice: true } },
    },
  });

  let totalRevenue = 0;
  let totalCost = 0;

  for (const sale of sales) {
    totalRevenue += sale.totalPrice;
    totalCost += sale.itemType.buyPrice * sale.quantity;
  }

  return {
    totalSales: sales.length,
    totalRevenue,
    totalCost,
    totalMargin: totalRevenue - totalCost,
  };
}

export async function deleteSale(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      itemType: { include: { category: true, rarity: true } },
    },
  });

  if (!sale) {
    throw new Error("Vente introuvable");
  }

  // Restore stock
  const stock = await prisma.stockItem.findUnique({
    where: { itemTypeId: sale.itemTypeId },
  });
  if (stock) {
    await prisma.stockItem.update({
      where: { itemTypeId: sale.itemTypeId },
      data: { quantity: stock.quantity + sale.quantity },
    });
  }

  return prisma.sale.delete({
    where: { id },
    include: {
      itemType: { include: { category: true, rarity: true } },
    },
  });
}
