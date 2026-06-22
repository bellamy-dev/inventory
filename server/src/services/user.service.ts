import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../utils/password";

const prisma = new PrismaClient();

export async function getAllUsers() {
  return prisma.user.findMany({
    include: {
      role: {
        select: {
          id: true,
          name: true,
          color: true,
          position: true,
        },
      },
    },
    orderBy: { username: "asc" },
  });
}

export async function createUser(
  username: string,
  password: string,
  roleId: string
) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new Error("Ce pseudo est déjà utilisé");
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new Error("Rôle introuvable");
  }

  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: { username, passwordHash, roleId },
    include: {
      role: {
        select: { id: true, name: true, color: true, position: true },
      },
    },
  });
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  // Prevent deleting the last admin
  const adminRole = await prisma.role.findFirst({
    where: { position: 0 },
    include: { users: true },
  });

  if (
    adminRole &&
    user.roleId === adminRole.id &&
    adminRole.users.length <= 1
  ) {
    throw new Error("Impossible de supprimer le dernier Admin");
  }

  return prisma.user.delete({ where: { id } });
}

export async function updateUserRole(userId: string, roleId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new Error("Rôle introuvable");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { roleId },
    include: {
      role: {
        select: { id: true, name: true, color: true, position: true },
      },
    },
  });
}
