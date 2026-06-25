import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getHarvestableItems() {
  return prisma.itemType.findMany({
    where: { harvestable: true },
    include: { category: true, rarity: true },
    orderBy: { name: "asc" },
  });
}

export async function declareHarvest(userId: string, itemTypeId: string, quantity: number) {
  if (quantity <= 0) throw new Error("La quantité doit être supérieure à 0");

  const itemType = await prisma.itemType.findUnique({ where: { id: itemTypeId } });
  if (!itemType) throw new Error("Type d'objet introuvable");
  if (!(itemType as any).harvestable) throw new Error("Cet objet n'est pas récoltable");

  return prisma.harvestEntry.create({
    data: {
      userId,
      itemTypeId,
      quantity,
      status: "PENDING",
      commissionPercent: 0,
    },
    include: {
      itemType: { include: { category: true, rarity: true } },
      user: { select: { id: true, username: true } },
    },
  });
}

export async function getMyHarvests(userId: string) {
  const harvests = await prisma.harvestEntry.findMany({
    where: { userId },
    include: {
      itemType: { include: { category: true, rarity: true } },
      reviewedBy: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return harvests.map((h) => ({
    ...h,
    itemType: h.itemType ?? { id: h.itemTypeId, name: "Objet supprimé", imageUrl: null, iconKey: null, category: { id: "", name: "?" }, rarity: { id: "", name: "?", color: "#6b7280", position: 0 }, weight: 0, buyPrice: 0, sellPrice: 0, unlimitedStock: false, maxStock: null, lowStockAlert: null, harvestable: false, harvestCommissionPercent: null, createdAt: new Date(), updatedAt: new Date() },
  }));
}

export async function getAllHarvests(filters?: { status?: string; userId?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.userId) where.userId = filters.userId;

  const harvests = await prisma.harvestEntry.findMany({
    where,
    include: {
      itemType: { include: { category: true, rarity: true } },
      user: { select: { id: true, username: true, avatarUrl: true } },
      reviewedBy: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return harvests.map((h) => ({
    ...h,
    itemType: h.itemType ?? { id: h.itemTypeId, name: "Objet supprimé", imageUrl: null, iconKey: null, category: { id: "", name: "?" }, rarity: { id: "", name: "?", color: "#6b7280", position: 0 }, weight: 0, buyPrice: 0, sellPrice: 0, unlimitedStock: false, maxStock: null, lowStockAlert: null, harvestable: false, harvestCommissionPercent: null, createdAt: new Date(), updatedAt: new Date() },
  }));
}

export async function approveHarvest(harvestId: string, reviewedById: string) {
  const harvest = await prisma.harvestEntry.findUnique({
    where: { id: harvestId },
    include: { itemType: true, user: true },
  });
  if (!harvest) throw new Error("Déclaration introuvable");
  if (harvest.status !== "PENDING") throw new Error("Cette déclaration a déjà été traitée");

  const commissionPercent =
    (harvest.user as any).harvestCommissionPercent ??
    (harvest.itemType as any).harvestCommissionPercent ??
    0;

  const totalValue = harvest.quantity * (harvest.itemType as any).sellPrice;
  const payoutAmount = (totalValue * commissionPercent) / 100;

  const updated = await prisma.$transaction(async (tx) => {
    const entry = await tx.harvestEntry.update({
      where: { id: harvestId },
      data: {
        status: "APPROVED",
        commissionPercent,
        totalValue,
        payoutAmount,
        reviewedById,
        reviewedAt: new Date(),
      },
      include: {
        itemType: { include: { category: true, rarity: true } },
        user: { select: { id: true, username: true } },
        reviewedBy: { select: { id: true, username: true } },
      },
    });

    await tx.stockItem.upsert({
      where: { itemTypeId: harvest.itemTypeId },
      update: { quantity: { increment: harvest.quantity } },
      create: { itemTypeId: harvest.itemTypeId, quantity: harvest.quantity, position: 0 },
    });

    await tx.user.update({
      where: { id: harvest.userId },
      data: { pendingPayout: { increment: payoutAmount } },
    });

    return entry;
  });

  return {
    ...updated,
    itemType: updated.itemType ?? { id: harvest.itemTypeId, name: "Objet supprimé", imageUrl: null, iconKey: null, category: { id: "", name: "?" }, rarity: { id: "", name: "?", color: "#6b7280", position: 0 }, weight: 0, buyPrice: 0, sellPrice: 0, unlimitedStock: false, maxStock: null, lowStockAlert: null, harvestable: false, harvestCommissionPercent: null, createdAt: new Date(), updatedAt: new Date() },
  };
}

export async function rejectHarvest(harvestId: string, reviewedById: string) {
  const harvest = await prisma.harvestEntry.findUnique({ where: { id: harvestId } });
  if (!harvest) throw new Error("Déclaration introuvable");
  if (harvest.status !== "PENDING") throw new Error("Cette déclaration a déjà été traitée");

  const updated = await prisma.harvestEntry.update({
    where: { id: harvestId },
    data: { status: "REJECTED", reviewedById, reviewedAt: new Date() },
    include: {
      itemType: { include: { category: true, rarity: true } },
      user: { select: { id: true, username: true } },
      reviewedBy: { select: { id: true, username: true } },
    },
  });

  return {
    ...updated,
    itemType: updated.itemType ?? { id: harvest.itemTypeId, name: "Objet supprimé", imageUrl: null, iconKey: null, category: { id: "", name: "?" }, rarity: { id: "", name: "?", color: "#6b7280", position: 0 }, weight: 0, buyPrice: 0, sellPrice: 0, unlimitedStock: false, maxStock: null, lowStockAlert: null, harvestable: false, harvestCommissionPercent: null, createdAt: new Date(), updatedAt: new Date() },
  };
}

export async function cancelReview(harvestId: string) {
  const harvest = await prisma.harvestEntry.findUnique({
    where: { id: harvestId },
    include: { itemType: true },
  });
  if (!harvest) throw new Error("Déclaration introuvable");
  if (harvest.status === "PENDING") throw new Error("Cette déclaration est déjà en attente");

  if (harvest.status === "APPROVED") {
    await prisma.$transaction(async (tx) => {
      // Reverse stock
      await tx.stockItem.update({
        where: { itemTypeId: harvest.itemTypeId },
        data: { quantity: { decrement: harvest.quantity } },
      });

      // Reverse payout
      if (harvest.payoutAmount && harvest.payoutAmount > 0) {
        await tx.user.update({
          where: { id: harvest.userId },
          data: { pendingPayout: { decrement: harvest.payoutAmount } },
        });
      }

      // Reset entry
      await tx.harvestEntry.update({
        where: { id: harvestId },
        data: {
          status: "PENDING",
          commissionPercent: 0,
          totalValue: null,
          payoutAmount: null,
          reviewedById: null,
          reviewedAt: null,
        },
      });
    });
  } else {
    // REJECTED -> PENDING: just reset
    await prisma.harvestEntry.update({
      where: { id: harvestId },
      data: {
        status: "PENDING",
        reviewedById: null,
        reviewedAt: null,
      },
    });
  }

  return prisma.harvestEntry.findUnique({
    where: { id: harvestId },
    include: {
      itemType: { include: { category: true, rarity: true } },
      user: { select: { id: true, username: true } },
      reviewedBy: { select: { id: true, username: true } },
    },
  });
}

export async function getHarvestStats() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      harvestCommissionPercent: true,
      pendingPayout: true,
      role: { select: { id: true, name: true, color: true } },
    },
    orderBy: { username: "asc" },
  });
}

export async function markPaid(userId: string, paidById: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  const amount = (user as any).pendingPayout;
  if (amount <= 0) throw new Error("Aucun montant à payer");

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { pendingPayout: 0 },
    });

    return tx.payoutHistory.create({
      data: { userId, amount, paidById },
      include: {
        user: { select: { id: true, username: true } },
        paidBy: { select: { id: true, username: true } },
      },
    });
  });
}

export async function getPayoutHistory() {
  return prisma.payoutHistory.findMany({
    include: {
      user: { select: { id: true, username: true } },
      paidBy: { select: { id: true, username: true } },
    },
    orderBy: { paidAt: "desc" },
  });
}
