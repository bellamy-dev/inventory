import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../types";
import { getStockItems, updateStock, addStock, removeStock, updatePositions } from "../services/stock.service";
import { createLog } from "../services/log.service";
import { broadcast } from "../events";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.use(authMiddleware);

router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const stockItems = await getStockItems();
    res.json({ stockItems });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /positions/update BEFORE /:itemTypeId to avoid route conflict
router.put(
  "/positions/update",
  requirePermission(Permission.STOCK_ADD),
  async (req: AuthRequest, res: Response) => {
    try {
      const { positions } = req.body;
      if (!Array.isArray(positions)) {
        res.status(400).json({ error: "positions doit être un tableau" });
        return;
      }

      await updatePositions(positions);
      res.json({ message: "Positions mises à jour" });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.put(
  "/:itemTypeId",
  requirePermission(Permission.STOCK_ADD),
  async (req: AuthRequest, res: Response) => {
    try {
      const itemTypeId = String(req.params.itemTypeId);
      const { quantity } = req.body;

      if (quantity === undefined || quantity < 0) {
        res.status(400).json({ error: "Quantité invalide" });
        return;
      }

      const stock = await updateStock(itemTypeId, quantity);

      const item = await prisma.itemType.findUnique({
        where: { id: itemTypeId },
        select: { name: true, imageUrl: true },
      });

      await createLog(req.user!.userId, "STOCK_UPDATED", {
        itemName: item?.name || itemTypeId,
        imageUrl: item?.imageUrl,
        quantity,
      });

      broadcast("stock-change", { type: "stock-change", action: "update", userId: req.user!.userId });

      res.json({ stock });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.post(
  "/:itemTypeId/add",
  requirePermission(Permission.STOCK_ADD),
  async (req: AuthRequest, res: Response) => {
    try {
      const itemTypeId = String(req.params.itemTypeId);
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: "Montant invalide" });
        return;
      }

      const stock = await addStock(itemTypeId, amount);

      const item = await prisma.itemType.findUnique({
        where: { id: itemTypeId },
        select: { name: true, imageUrl: true },
      });

      await createLog(req.user!.userId, "STOCK_ADDED", {
        itemName: item?.name || itemTypeId,
        imageUrl: item?.imageUrl,
        amount,
      });

      broadcast("stock-change", { type: "stock-change", action: "add", userId: req.user!.userId });

      res.json({ stock });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.post(
  "/:itemTypeId/remove",
  requirePermission(Permission.STOCK_ADD),
  async (req: AuthRequest, res: Response) => {
    try {
      const itemTypeId = String(req.params.itemTypeId);
      const { amount, reason } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: "Montant invalide" });
        return;
      }

      const stock = await removeStock(itemTypeId, amount, reason);

      const item = await prisma.itemType.findUnique({
        where: { id: itemTypeId },
        select: { name: true, imageUrl: true },
      });

      await createLog(req.user!.userId, "STOCK_REMOVED", {
        itemName: item?.name || itemTypeId,
        imageUrl: item?.imageUrl,
        amount,
        reason: reason || "Retiré du stock",
      });

      broadcast("stock-change", { type: "stock-change", action: "remove", userId: req.user!.userId });

      res.json({ stock });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

export default router;
