import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../types";
import {
  getAllUsers,
  createUser,
  deleteUser,
  updateUserRole,
} from "../services/user.service";
import { createLog } from "../services/log.service";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  requirePermission(Permission.USERS_MANAGE),
  async (_req: AuthRequest, res: Response) => {
    try {
      const users = await getAllUsers();
      res.json({ users });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

router.post(
  "/",
  requirePermission(Permission.USERS_MANAGE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { username, password, roleId } = req.body;
      if (!username || !password || !roleId) {
        res.status(400).json({ error: "Tous les champs sont requis" });
        return;
      }

      const user = await createUser(username, password, roleId);

      await createLog(req.user!.userId, "USER_CREATED", {
        username: user.username,
        userId: user.id,
      });

      res.status(201).json({ user });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.delete(
  "/:id",
  requirePermission(Permission.USERS_MANAGE),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const user = await deleteUser(id);

      await createLog(req.user!.userId, "USER_DELETED", {
        username: user.username,
        userId: user.id,
      });

      res.json({ message: "Utilisateur supprimé", user });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.patch(
  "/:id/role",
  requirePermission(Permission.USERS_MANAGE),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const { roleId } = req.body;
      if (!roleId) {
        res.status(400).json({ error: "roleId requis" });
        return;
      }

      const user = await updateUserRole(id, roleId);

      await createLog(req.user!.userId, "USER_ROLE_CHANGED", {
        username: user.username,
        userId: user.id,
        newRoleId: roleId,
      });

      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

export default router;
