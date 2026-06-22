import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../types";
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  updateRoleHierarchy,
  updateRolePermissions,
} from "../services/role.service";
import { createLog } from "../services/log.service";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  requirePermission(Permission.ROLES_MANAGE),
  async (_req: AuthRequest, res: Response) => {
    try {
      const roles = await getAllRoles();
      res.json({ roles });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

router.post(
  "/",
  requirePermission(Permission.ROLES_MANAGE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, color, permissions } = req.body;
      if (!name) {
        res.status(400).json({ error: "Le nom du rôle est requis" });
        return;
      }

      const role = await createRole(name, color || "#6b7280", permissions || []);

      await createLog(req.user!.userId, "ROLE_CREATED", {
        roleName: role.name,
        roleId: role.id,
      });

      res.status(201).json({ role });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.put(
  "/hierarchy",
  requirePermission(Permission.ROLES_MANAGE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { roleOrders } = req.body;
      if (!Array.isArray(roleOrders)) {
        res.status(400).json({ error: "roleOrders doit être un tableau" });
        return;
      }

      await updateRoleHierarchy(roleOrders);

      await createLog(req.user!.userId, "ROLE_HIERARCHY_CHANGED", {
        roleOrders,
      });

      const roles = await getAllRoles();
      res.json({ roles });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.put(
  "/:id",
  requirePermission(Permission.ROLES_MANAGE),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const { name, color } = req.body;

      const role = await updateRole(id, { name, color });

      await createLog(req.user!.userId, "ROLE_UPDATED", {
        roleName: role.name,
        roleId: role.id,
      });

      res.json({ role });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.delete(
  "/:id",
  requirePermission(Permission.ROLES_MANAGE),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const role = await deleteRole(id);

      await createLog(req.user!.userId, "ROLE_DELETED", {
        roleName: role.name,
        roleId: role.id,
      });

      res.json({ message: "Rôle supprimé", role });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.put(
  "/:id/permissions",
  requirePermission(Permission.ROLES_MANAGE),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        res.status(400).json({ error: "permissions doit être un tableau" });
        return;
      }

      const role = await updateRolePermissions(id, permissions);

      await createLog(req.user!.userId, "ROLE_PERMISSIONS_CHANGED", {
        roleName: role!.name,
        roleId: id,
        permissions,
      });

      res.json({ role });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

export default router;
