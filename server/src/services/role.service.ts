import { PrismaClient } from "@prisma/client";
import { Permission } from "../types";

const prisma = new PrismaClient();

export async function getAllRoles() {
  return prisma.role.findMany({
    include: {
      permissions: {
        select: { permission: true },
      },
      _count: { select: { users: true } },
    },
    orderBy: { position: "asc" },
  });
}

export async function createRole(
  name: string,
  color: string,
  permissions: Permission[]
) {
  const existing = await prisma.role.findUnique({ where: { name } });
  if (existing) {
    throw new Error("Ce nom de rôle existe déjà");
  }

  // Get next position
  const lastRole = await prisma.role.findFirst({
    orderBy: { position: "desc" },
  });
  const nextPosition = lastRole ? lastRole.position + 1 : 0;

  return prisma.role.create({
    data: {
      name,
      color,
      position: nextPosition,
      permissions: {
        create: permissions.map((p) => ({ permission: p })),
      },
    },
    include: {
      permissions: { select: { permission: true } },
      _count: { select: { users: true } },
    },
  });
}

export async function updateRole(
  id: string,
  data: { name?: string; color?: string }
) {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    throw new Error("Rôle introuvable");
  }

  if (data.name && data.name !== role.name) {
    const existing = await prisma.role.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new Error("Ce nom de rôle existe déjà");
    }
  }

  return prisma.role.update({
    where: { id },
    data,
    include: {
      permissions: { select: { permission: true } },
      _count: { select: { users: true } },
    },
  });
}

export async function deleteRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { users: true },
  });

  if (!role) {
    throw new Error("Rôle introuvable");
  }

  if (role.isSystem) {
    throw new Error("Impossible de supprimer un rôle système");
  }

  if (role.users.length > 0) {
    throw new Error(
      "Impossible de supprimer un rôle qui a des utilisateurs assignés"
    );
  }

  return prisma.role.delete({ where: { id } });
}

export async function updateRoleHierarchy(
  roleOrders: { id: string; position: number }[]
) {
  // Two-phase update to avoid unique constraint conflicts on position
  // Phase 1: set all positions to negative temp values
  const tempUpdates = roleOrders.map((r, i) =>
    prisma.role.update({
      where: { id: r.id },
      data: { position: -(i + 1) },
    })
  );
  await prisma.$transaction(tempUpdates);

  // Phase 2: set final positions
  const finalUpdates = roleOrders.map((r) =>
    prisma.role.update({
      where: { id: r.id },
      data: { position: r.position },
    })
  );
  return prisma.$transaction(finalUpdates);
}

export async function updateRolePermissions(
  roleId: string,
  permissions: Permission[]
) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new Error("Rôle introuvable");
  }

  // Delete existing permissions and recreate
  await prisma.rolePermission.deleteMany({ where: { roleId } });

  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({ roleId, permission: p })),
  });

  return prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: { select: { permission: true } },
      _count: { select: { users: true } },
    },
  });
}
