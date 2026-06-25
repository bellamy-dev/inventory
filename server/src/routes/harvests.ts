import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../types";
import {
  getHarvestableItems,
  declareHarvest,
  getMyHarvests,
  getAllHarvests,
  approveHarvest,
  rejectHarvest,
  cancelReview,
  getHarvestStats,
  markPaid,
  getPayoutHistory,
} from "../services/harvest.service";
import { createLog } from "../services/log.service";
import { notifyHarvestValidated } from "../services/webhook.service";
import { broadcast } from "../events";

const router = Router();

router.use(authMiddleware);

// --- Items harvestables (pour le dropdown) ---

router.get(
  "/items",
  requirePermission(Permission.HARVEST_DECLARE),
  async (_req: AuthRequest, res: Response) => {
    try {
      const items = await getHarvestableItems();
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// --- Déclaration (HARVEST_DECLARE) ---

router.post(
  "/",
  requirePermission(Permission.HARVEST_DECLARE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { itemTypeId, quantity } = req.body;
      if (!itemTypeId || !quantity) {
        res.status(400).json({ error: "itemTypeId et quantity requis" });
        return;
      }

      const harvest = await declareHarvest(req.user!.userId, itemTypeId, parseInt(quantity));

      await createLog(req.user!.userId, "HARVEST_DECLARED", {
        itemName: (harvest.itemType as any).name,
        quantity: harvest.quantity,
      });

      res.status(201).json({ harvest });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.get(
  "/mine",
  requirePermission(Permission.HARVEST_DECLARE),
  async (req: AuthRequest, res: Response) => {
    try {
      const harvests = await getMyHarvests(req.user!.userId);
      res.json({ harvests });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// --- Validation (HARVEST_VALIDATE) ---

router.get(
  "/",
  requirePermission(Permission.HARVEST_VALIDATE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, userId } = req.query;
      const harvests = await getAllHarvests({
        status: status as string | undefined,
        userId: userId as string | undefined,
      });
      res.json({ harvests });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

router.post(
  "/:id/approve",
  requirePermission(Permission.HARVEST_VALIDATE),
  async (req: AuthRequest, res: Response) => {
    try {
      const harvest = await approveHarvest(String(req.params.id), req.user!.userId);

      await createLog(req.user!.userId, "HARVEST_APPROVED", {
        itemName: (harvest.itemType as any).name,
        quantity: harvest.quantity,
        commissionPercent: harvest.commissionPercent,
        totalValue: harvest.totalValue,
        payoutAmount: harvest.payoutAmount,
        memberUsername: (harvest.user as any).username,
      });

      notifyHarvestValidated(
        (harvest.user as any).username,
        (harvest.itemType as any).name,
        harvest.quantity,
        harvest.commissionPercent,
        harvest.totalValue ?? 0,
        harvest.payoutAmount ?? 0,
        (harvest.itemType as any).imageUrl
      ).catch(() => {});

      broadcast("stock-change", { type: "stock-change", action: "harvest-approve", userId: req.user!.userId });

      res.json({ harvest });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.post(
  "/:id/reject",
  requirePermission(Permission.HARVEST_VALIDATE),
  async (req: AuthRequest, res: Response) => {
    try {
      const harvest = await rejectHarvest(String(req.params.id), req.user!.userId);

      await createLog(req.user!.userId, "HARVEST_REJECTED", {
        itemName: (harvest.itemType as any).name,
        quantity: harvest.quantity,
        memberUsername: (harvest.user as any).username,
      });

      res.json({ harvest });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.post(
  "/:id/cancel",
  requirePermission(Permission.HARVEST_VALIDATE),
  async (req: AuthRequest, res: Response) => {
    try {
      const harvest = await cancelReview(String(req.params.id));

      await createLog(req.user!.userId, "HARVEST_REVIEW_CANCELLED", {
        itemName: (harvest!.itemType as any).name,
        quantity: harvest!.quantity,
      });

      res.json({ harvest });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// --- Stats & Paiements ---

router.get(
  "/stats",
  async (_req: AuthRequest, res: Response) => {
    try {
      const stats = await getHarvestStats();
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

router.post(
  "/users/:id/mark-paid",
  requirePermission(Permission.HARVEST_VALIDATE),
  async (req: AuthRequest, res: Response) => {
    try {
      const payout = await markPaid(String(req.params.id), req.user!.userId);

      await createLog(req.user!.userId, "HARVEST_MARKED_PAID", {
        memberUsername: payout.user.username,
        amount: payout.amount,
      });

      res.json({ payout });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.get(
  "/payouts/history",
  async (_req: AuthRequest, res: Response) => {
    try {
      const history = await getPayoutHistory();
      res.json({ history });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

export default router;
