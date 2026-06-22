import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { PrismaClient } from "@prisma/client";
import { Permission } from "../types";

const prisma = new PrismaClient();

export function requirePermission(...permissions: Permission[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Non authentifié" });
      return;
    }

    const userRole = await prisma.role.findUnique({
      where: { id: req.user.roleId },
      include: { permissions: true },
    });

    if (!userRole) {
      res.status(403).json({ error: "Rôle introuvable" });
      return;
    }

    // Admin (position 0) has all permissions
    if (userRole.position === 0) {
      next();
      return;
    }

    const userPermissions = userRole.permissions.map((p) => p.permission) as Permission[];
    const hasPermission = permissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      res
        .status(403)
        .json({ error: "Permission insuffisante", required: permissions });
      return;
    }

    next();
  };
}
