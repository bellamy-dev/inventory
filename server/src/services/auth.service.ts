import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { JwtPayload } from "../types";

const prisma = new PrismaClient();

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  });

  if (!user) {
    throw new Error("Identifiants incorrects");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("Identifiants incorrects");
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    roleId: user.roleId,
    rolePosition: user.role.position,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      role: {
        id: user.role.id,
        name: user.role.name,
        color: user.role.color,
        position: user.role.position,
      },
      permissions: user.role.permissions.map((p: { permission: string }) => p.permission),
    },
  };
}

export async function refreshAuth(refreshToken: string) {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: { include: { permissions: true } },
      },
    });

    if (!user) {
      throw new Error("Utilisateur introuvable");
    }

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      roleId: user.roleId,
      rolePosition: user.role.position,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: {
          id: user.role.id,
          name: user.role.name,
          color: user.role.color,
          position: user.role.position,
        },
        permissions: user.role.permissions.map((p: { permission: string }) => p.permission),
      },
    };
  } catch {
    throw new Error("Refresh token invalide");
  }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { include: { permissions: true } },
    },
  });

  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  return {
    id: user.id,
    username: user.username,
    role: {
      id: user.role.id,
      name: user.role.name,
      color: user.role.color,
      position: user.role.position,
    },
    permissions: user.role.permissions.map((p: { permission: string }) => p.permission),
  };
}
