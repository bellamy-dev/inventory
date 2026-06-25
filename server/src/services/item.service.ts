import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAllItemTypes(categoryId?: string, search?: string) {
  const where: Record<string, unknown> = {};
  if (categoryId) where.categoryId = categoryId;
  if (search) where.name = { contains: search, mode: "insensitive" };

  return prisma.itemType.findMany({
    where,
    include: {
      category: true,
      rarity: true,
      stockItems: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getItemType(id: string) {
  return prisma.itemType.findUnique({
    where: { id },
    include: {
      category: true,
      rarity: true,
      stockItems: true,
    },
  });
}

export async function createItemType(data: {
  name: string;
  imageUrl?: string | null;
  iconKey?: string | null;
  categoryId: string;
  rarityId: string;
  weight?: number;
  buyPrice?: number;
  sellPrice?: number;
  unlimitedStock?: boolean;
  maxStock?: number | null;
  lowStockAlert?: number | null;
  harvestCommissionPercent?: number | null;
  harvestable?: boolean;
}) {
  // Check unique name within category
  const existing = await prisma.itemType.findUnique({
    where: { name_categoryId: { name: data.name, categoryId: data.categoryId } },
  });
  if (existing) {
    throw new Error("Un objet avec ce nom existe déjà dans cette catégorie");
  }

  const itemType = await prisma.itemType.create({
    data,
    include: { category: true, rarity: true },
  });

  // Create stock entry
  await prisma.stockItem.create({
    data: {
      itemTypeId: itemType.id,
      quantity: 0,
      position: 0,
    },
  });

  return itemType;
}

export async function updateItemType(
  id: string,
  data: {
    name?: string;
    imageUrl?: string | null;
    iconKey?: string | null;
    categoryId?: string;
    rarityId?: string;
    weight?: number;
    buyPrice?: number;
    sellPrice?: number;
    unlimitedStock?: boolean;
    maxStock?: number | null;
    lowStockAlert?: number | null;
    harvestCommissionPercent?: number | null;
    harvestable?: boolean;
  }
) {
  const item = await prisma.itemType.findUnique({ where: { id } });
  if (!item) {
    throw new Error("Objet introuvable");
  }

  if (data.name && data.categoryId) {
    const existing = await prisma.itemType.findUnique({
      where: {
        name_categoryId: { name: data.name, categoryId: data.categoryId },
      },
    });
    if (existing && existing.id !== id) {
      throw new Error(
        "Un objet avec ce nom existe déjà dans cette catégorie"
      );
    }
  }

  return prisma.itemType.update({
    where: { id },
    data,
    include: { category: true, rarity: true, stockItems: true },
  });
}

export async function deleteItemType(id: string) {
  const item = await prisma.itemType.findUnique({ where: { id } });
  if (!item) {
    throw new Error("Objet introuvable");
  }

  // Delete associated sales, stock, then the item
  await prisma.sale.deleteMany({ where: { itemTypeId: id } });
  await prisma.stockItem.deleteMany({ where: { itemTypeId: id } });
  return prisma.itemType.delete({ where: { id } });
}
