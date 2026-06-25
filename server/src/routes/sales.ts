import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../types";
import { createSale, getSales, getSaleStats, deleteSale } from "../services/sale.service";
import { createLog } from "../services/log.service";
import { notifySale } from "../services/webhook.service";
import { broadcast } from "../events";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  requirePermission(Permission.STOCK_SELL),
  async (req: AuthRequest, res: Response) => {
    try {
      const { itemTypeId, quantity, buyerName } = req.body;

      if (!itemTypeId || !quantity || quantity <= 0) {
        res.status(400).json({ error: "Objet et quantité invalide requis" });
        return;
      }

      const sale = await createSale({
        itemTypeId,
        quantity,
        buyerName,
        sellerId: req.user!.userId,
      });

      await createLog(req.user!.userId, "SALE_COMPLETED", {
        itemName: sale.itemType.name,
        imageUrl: (sale.itemType as any).imageUrl,
        quantity: sale.quantity,
        totalPrice: sale.totalPrice,
        buyerName: sale.buyerName,
        saleId: sale.id,
      });

      notifySale(
        sale.itemType.name,
        sale.quantity,
        sale.totalPrice,
        req.user!.username,
        (sale.itemType as any).imageUrl
      ).catch(() => {});

      broadcast("stock-change", { type: "stock-change", action: "sale", userId: req.user!.userId });

      res.status(201).json({ sale });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.get(
  "/",
  requirePermission(Permission.SALES_HISTORY_VIEW),
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate, sellerId, itemTypeId, page, limit } =
        req.query;

      const result = await getSales({
        startDate: startDate as string,
        endDate: endDate as string,
        sellerId: sellerId as string,
        itemTypeId: itemTypeId as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

router.get(
  "/stats",
  requirePermission(Permission.SALES_HISTORY_VIEW),
  async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await getSaleStats({
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

router.delete(
  "/:id",
  requirePermission(Permission.STOCK_SELL),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const sale = await deleteSale(id);

      await createLog(req.user!.userId, "SALE_DELETED", {
        itemName: sale.itemType.name,
        imageUrl: (sale.itemType as any).imageUrl,
        quantity: sale.quantity,
        totalPrice: sale.totalPrice,
        saleId: sale.id,
      });

      broadcast("stock-change", { type: "stock-change", action: "sale-delete", userId: req.user!.userId });

      res.json({ message: "Vente supprimée", sale });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

export default router;
