import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../types";
import {
  getAllItemTypes,
  getItemType,
  createItemType,
  updateItemType,
  deleteItemType,
} from "../services/item.service";
import { createLog } from "../services/log.service";
import { notifyItemCreated, notifyItemDeleted } from "../services/webhook.service";
import { broadcast } from "../events";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Format d'image non supporté"));
    }
  },
});

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, search } = req.query;
    const items = await getAllItemTypes(
      categoryId as string | undefined,
      search as string | undefined
    );
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const item = await getItemType(String(req.params.id));
    if (!item) {
      res.status(404).json({ error: "Objet introuvable" });
      return;
    }
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post(
  "/",
  requirePermission(Permission.ITEM_CREATE),
  upload.single("image"),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = {
        name: req.body.name,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || null,
        iconKey: req.body.iconKey || null,
        categoryId: req.body.categoryId,
        rarityId: req.body.rarityId,
        weight: parseFloat(req.body.weight) || 0,
        buyPrice: parseFloat(req.body.buyPrice) || 0,
        sellPrice: parseFloat(req.body.sellPrice) || 0,
        unlimitedStock: req.body.unlimitedStock === "true",
        maxStock: req.body.maxStock ? parseInt(req.body.maxStock) : null,
        lowStockAlert: req.body.lowStockAlert ? parseInt(req.body.lowStockAlert) : null,
        harvestCommissionPercent: req.body.harvestCommissionPercent
          ? parseFloat(req.body.harvestCommissionPercent)
          : null,
        harvestable: req.body.harvestable === "true",
      };

      if (!data.name || !data.categoryId || !data.rarityId) {
        res.status(400).json({ error: "Nom, catégorie et rareté requis" });
        return;
      }

      const item = await createItemType(data);

      await createLog(req.user!.userId, "ITEM_CREATED", {
        itemName: item.name,
        itemId: item.id,
        imageUrl: item.imageUrl,
        categoryName: (item as any).category?.name,
        rarityName: (item as any).rarity?.name,
      });

      // Discord webhook (non-blocking)
      notifyItemCreated(item.name, (item as any).category?.name, item.imageUrl).catch(() => {});

      broadcast("stock-change", { type: "stock-change", action: "item-create", userId: req.user!.userId });

      res.status(201).json({ item });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.put(
  "/:id",
  requirePermission(Permission.ITEM_EDIT),
  upload.single("image"),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const data: Record<string, unknown> = {};

      if (req.body.name) data.name = req.body.name;
      if (req.body.categoryId) data.categoryId = req.body.categoryId;
      if (req.body.rarityId) data.rarityId = req.body.rarityId;
      if (req.body.weight !== undefined) data.weight = parseFloat(req.body.weight);
      if (req.body.buyPrice !== undefined) data.buyPrice = parseFloat(req.body.buyPrice);
      if (req.body.sellPrice !== undefined) data.sellPrice = parseFloat(req.body.sellPrice);
      if (req.body.unlimitedStock !== undefined)
        data.unlimitedStock = req.body.unlimitedStock === "true";
      if (req.body.maxStock !== undefined)
        data.maxStock = req.body.maxStock ? parseInt(req.body.maxStock) : undefined;
      if (req.body.lowStockAlert !== undefined)
        data.lowStockAlert = req.body.lowStockAlert ? parseInt(req.body.lowStockAlert) : undefined;
      if (req.body.iconKey !== undefined) data.iconKey = req.body.iconKey;
      if (req.body.harvestCommissionPercent !== undefined)
        data.harvestCommissionPercent = req.body.harvestCommissionPercent
          ? parseFloat(req.body.harvestCommissionPercent)
          : null;
      if (req.body.harvestable !== undefined)
        data.harvestable = req.body.harvestable === "true";

      if (req.file) {
        data.imageUrl = `/uploads/${req.file.filename}`;
      }

      const item = await updateItemType(id, data as any);

      await createLog(req.user!.userId, "ITEM_UPDATED", {
        itemName: item.name,
        itemId: item.id,
        imageUrl: item.imageUrl,
      });

      broadcast("stock-change", { type: "stock-change", action: "item-update", userId: req.user!.userId });

      res.json({ item });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.delete(
  "/:id",
  requirePermission(Permission.ITEM_DELETE),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);
      const item = await getItemType(id);
      if (!item) {
        res.status(404).json({ error: "Objet introuvable" });
        return;
      }

      await deleteItemType(id);

      await createLog(req.user!.userId, "ITEM_DELETED", {
        itemName: item.name,
        itemId: item.id,
        imageUrl: item.imageUrl,
        categoryName: (item as any).category?.name,
      });

      notifyItemDeleted(item.name, (item as any).category?.name).catch(() => {});

      broadcast("stock-change", { type: "stock-change", action: "item-delete", userId: req.user!.userId });

      res.json({ message: "Objet supprimé" });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

export default router;
