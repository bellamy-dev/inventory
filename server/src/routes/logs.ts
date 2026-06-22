import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../types";
import { getLogs } from "../services/log.service";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  requirePermission(Permission.LOGS_VIEW),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, action } = req.query;
      const result = await getLogs({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 100,
        action: action as string,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

export default router;
