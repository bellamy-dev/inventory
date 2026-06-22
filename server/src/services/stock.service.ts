import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getStockItems() {
  return prisma.stockItem.findMany({
    include: {
      itemType: {
        include: { category: true, rarity: true },
      },
    },
    orderBy: { position: "asc" },
  });
}

export async function updateStock(
  itemTypeId: string,
  quantity: number,
  position?: number
) {
  const stock = await prisma.stockItem.findUnique({ where: { itemTypeId } });
  if (!stock) {
    throw new Error("Entrée de stock introuvable");
  }

  const item = await prisma.itemType.findUnique({
    where: { id: itemTypeId },
    include: { stockItems: true },
  });

  if (!item) throw new Error("Objet introuvable");

  if (!item.unlimitedStock && item.maxStock && quantity > item.maxStock) {
    throw new Error(`Stock maximum atteint (${item.maxStock})`);
  }

  if (quantity < 0) {
    throw new Error("La quantité ne peut pas être négative");
  }

  const data: { quantity: number; position?: number } = { quantity };
  if (position !== undefined) data.position = position;

  return prisma.stockItem.update({
    where: { itemTypeId },
    data,
    include: {
      itemType: { include: { category: true, rarity: true } },
    },
  });
}

export async function addStock(itemTypeId: string, amount: number) {
  const stock = await prisma.stockItem.findUnique({ where: { itemTypeId } });
  if (!stock) {
    throw new Error("Entrée de stock introuvable");
  }

  const item = await prisma.itemType.findUnique({ where: { id: itemTypeId } });
  if (!item) throw new Error("Objet introuvable");

  const newQuantity = stock.quantity + amount;

  if (!item.unlimitedStock && item.maxStock && newQuantity > item.maxStock) {
    throw new Error(
      `Stock maximum atteint (${item.maxStock}). Actuel: ${stock.quantity}`
    );
  }

  return prisma.stockItem.update({
    where: { itemTypeId },
    data: { quantity: newQuantity },
    include: {
      itemType: { include: { category: true, rarity: true } },
    },
  });
}

export async function removeStock(itemTypeId: string, amount: number, reason?: string) {
  const stock = await prisma.stockItem.findUnique({ where: { itemTypeId } });
  if (!stock) {
    throw new Error("Entrée de stock introuvable");
  }

  if (amount <= 0) {
    throw new Error("Le montant doit être supérieur à 0");
  }

  if (stock.quantity < amount) {
    throw new Error(
      `Stock insuffisant. Actuel: ${stock.quantity}, demandé: ${amount}`
    );
  }

  const newQuantity = stock.quantity - amount;

  return prisma.stockItem.update({
    where: { itemTypeId },
    data: { quantity: newQuantity },
    include: {
      itemType: { include: { category: true, rarity: true } },
    },
  });
}

export async function updatePositions(
  positions: { itemTypeId: string; position: number }[]
) {
  const updates = positions.map((p) =>
    prisma.stockItem.update({
      where: { itemTypeId: p.itemTypeId },
      data: { position: p.position },
    })
  );
  return prisma.$transaction(updates);
}
