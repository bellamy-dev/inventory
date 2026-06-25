import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAllVehicles() {
  return prisma.vehicle.findMany({
    include: {
      items: {
        include: {
          itemType: { include: { category: true, rarity: true } },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { position: "asc" },
  });
}

export async function getVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          itemType: { include: { category: true, rarity: true } },
        },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!vehicle) throw new Error("Véhicule introuvable");
  return vehicle;
}

export async function createVehicle(name: string, maxWeight: number, imageUrl?: string) {
  if (!name.trim()) throw new Error("Le nom est requis");
  if (maxWeight <= 0) throw new Error("Le poids maximum doit être supérieur à 0");

  const existing = await prisma.vehicle.findUnique({ where: { name: name.trim() } });
  if (existing) throw new Error("Un véhicule avec ce nom existe déjà");

  const maxPos = await prisma.vehicle.aggregate({ _max: { position: true } });

  return prisma.vehicle.create({
    data: {
      name: name.trim(),
      maxWeight,
      imageUrl: imageUrl || null,
      position: (maxPos._max.position ?? -1) + 1,
    },
  });
}

export async function updateVehicle(id: string, name: string, maxWeight: number, imageUrl?: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new Error("Véhicule introuvable");

  if (name.trim() && name.trim() !== vehicle.name) {
    const existing = await prisma.vehicle.findUnique({ where: { name: name.trim() } });
    if (existing) throw new Error("Un véhicule avec ce nom existe déjà");
  }

  const data: Record<string, unknown> = {
    name: name.trim() || vehicle.name,
    maxWeight: maxWeight > 0 ? maxWeight : vehicle.maxWeight,
  };
  if (imageUrl !== undefined) data.imageUrl = imageUrl || null;

  return prisma.vehicle.update({
    where: { id },
    data,
  });
}

export async function deleteVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new Error("Véhicule introuvable");
  return prisma.vehicle.delete({ where: { id } });
}

export async function getVehicleItems(vehicleId: string) {
  await getVehicle(vehicleId);
  return prisma.vehicleStockItem.findMany({
    where: { vehicleId },
    include: {
      itemType: { include: { category: true, rarity: true } },
    },
    orderBy: { position: "asc" },
  });
}

function getVehicleTotalWeight(vehicleId: string) {
  return prisma.vehicleStockItem.aggregate({
    where: { vehicleId },
    _sum: { quantity: true },
  });
}

export async function addVehicleItem(vehicleId: string, itemTypeId: string, quantity: number) {
  if (quantity <= 0) throw new Error("La quantité doit être supérieure à 0");

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new Error("Véhicule introuvable");

  const itemType = await prisma.itemType.findUnique({ where: { id: itemTypeId } });
  if (!itemType) throw new Error("Objet introuvable");

  const itemWeight = itemType.weight * quantity;

  const currentWeight = await prisma.vehicleStockItem.aggregate({
    where: { vehicleId },
    _sum: { quantity: true },
  });
  const currentTotalWeight = (currentWeight._sum.quantity ?? 0) * itemType.weight;

  if (currentTotalWeight + itemWeight > vehicle.maxWeight) {
    throw new Error(`Poids maximum du véhicule atteint (${vehicle.maxWeight}kg)`);
  }

  const existing = await prisma.vehicleStockItem.findUnique({
    where: { vehicleId_itemTypeId: { vehicleId, itemTypeId } },
  });

  if (existing) {
    return prisma.vehicleStockItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
      include: { itemType: { include: { category: true, rarity: true } } },
    });
  }

  const maxPos = await prisma.vehicleStockItem.aggregate({
    where: { vehicleId },
    _max: { position: true },
  });

  return prisma.vehicleStockItem.create({
    data: {
      vehicleId,
      itemTypeId,
      quantity,
      position: (maxPos._max.position ?? -1) + 1,
    },
    include: { itemType: { include: { category: true, rarity: true } } },
  });
}

export async function removeVehicleItem(vehicleId: string, itemTypeId: string, quantity: number) {
  if (quantity <= 0) throw new Error("La quantité doit être supérieure à 0");

  const existing = await prisma.vehicleStockItem.findUnique({
    where: { vehicleId_itemTypeId: { vehicleId, itemTypeId } },
  });

  if (!existing) throw new Error("Objet non présent dans le véhicule");
  if (existing.quantity < quantity) {
    throw new Error(`Stock insuffisant. Actuel: ${existing.quantity}, demandé: ${quantity}`);
  }

  const newQty = existing.quantity - quantity;
  if (newQty === 0) {
    return prisma.vehicleStockItem.delete({ where: { id: existing.id } });
  }

  return prisma.vehicleStockItem.update({
    where: { id: existing.id },
    data: { quantity: newQty },
    include: { itemType: { include: { category: true, rarity: true } } },
  });
}

export async function updateVehiclePositions(positions: { vehicleId: string; position: number }[]) {
  const updates = positions.map((p) =>
    prisma.vehicle.update({
      where: { id: p.vehicleId },
      data: { position: p.position },
    })
  );
  return prisma.$transaction(updates);
}

export async function updateVehicleItemPositions(vehicleId: string, positions: { itemTypeId: string; position: number }[]) {
  const updates = positions.map((p) =>
    prisma.vehicleStockItem.update({
      where: { vehicleId_itemTypeId: { vehicleId, itemTypeId: p.itemTypeId } },
      data: { position: p.position },
    })
  );
  return prisma.$transaction(updates);
}

export async function moveItemBetweenInventories(
  fromType: "stock" | "vehicle",
  fromId: string,
  toType: "stock" | "vehicle",
  toId: string,
  itemTypeId: string,
  quantity: number
) {
  if (quantity <= 0) throw new Error("La quantité doit être supérieure à 0");
  if (fromType === toType && fromId === toId) throw new Error("Source et destination sont identiques");

  const itemType = await prisma.itemType.findUnique({ where: { id: itemTypeId } });
  if (!itemType) throw new Error("Objet introuvable");

  const itemWeight = itemType.weight * quantity;

  return prisma.$transaction(async (tx) => {
    // Remove from source
    if (fromType === "stock") {
      const stock = await tx.stockItem.findUnique({ where: { itemTypeId } });
      if (!stock) throw new Error("Objet non présent dans l'inventaire");
      if (stock.quantity < quantity) {
        throw new Error(`Stock insuffisant. Actuel: ${stock.quantity}, demandé: ${quantity}`);
      }
      const newQty = stock.quantity - quantity;
      await tx.stockItem.update({ where: { itemTypeId }, data: { quantity: newQty } });
    } else {
      const vsi = await tx.vehicleStockItem.findUnique({
        where: { vehicleId_itemTypeId: { vehicleId: fromId, itemTypeId } },
      });
      if (!vsi) throw new Error("Objet non présent dans le véhicule source");
      if (vsi.quantity < quantity) {
        throw new Error(`Stock insuffisant. Actuel: ${vsi.quantity}, demandé: ${quantity}`);
      }
      const newQty = vsi.quantity - quantity;
      if (newQty === 0) {
        await tx.vehicleStockItem.delete({ where: { id: vsi.id } });
      } else {
        await tx.vehicleStockItem.update({ where: { id: vsi.id }, data: { quantity: newQty } });
      }
    }

    // Add to destination
    if (toType === "stock") {
      const existing = await tx.stockItem.findUnique({ where: { itemTypeId } });
      if (existing) {
        await tx.stockItem.update({
          where: { itemTypeId },
          data: { quantity: existing.quantity + quantity },
        });
      } else {
        await tx.stockItem.create({
          data: { itemTypeId, quantity, position: 0 },
        });
      }
    } else {
      const vehicle = await tx.vehicle.findUnique({ where: { id: toId } });
      if (!vehicle) throw new Error("Véhicule destination introuvable");

      const vsi = await tx.vehicleStockItem.findUnique({
        where: { vehicleId_itemTypeId: { vehicleId: toId, itemTypeId } },
      });

      if (vsi) {
        await tx.vehicleStockItem.update({
          where: { id: vsi.id },
          data: { quantity: vsi.quantity + quantity },
        });
      } else {
        const maxPos = await tx.vehicleStockItem.aggregate({
          where: { vehicleId: toId },
          _max: { position: true },
        });
        await tx.vehicleStockItem.create({
          data: {
            vehicleId: toId,
            itemTypeId,
            quantity,
            position: (maxPos._max.position ?? -1) + 1,
          },
        });
      }
    }

    return { success: true };
  });
}
