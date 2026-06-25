import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../types";
import {
  getAllVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleItems,
  addVehicleItem,
  removeVehicleItem,
  updateVehiclePositions,
  updateVehicleItemPositions,
  moveItemBetweenInventories,
} from "../services/vehicle.service";
import { createLog } from "../services/log.service";
import { broadcast } from "../events";
import { PrismaClient } from "@prisma/client";
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

const prisma = new PrismaClient();
const router = Router();

router.use(authMiddleware);

// --- Vehicles CRUD ---

router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const vehicles = await getAllVehicles();
    res.json({ vehicles });
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
      const { name, maxWeight } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const vehicle = await createVehicle(name, parseFloat(maxWeight) || 300, imageUrl);

      await createLog(req.user!.userId, "VEHICLE_CREATED", {
        vehicleName: vehicle.name,
      });

      broadcast("vehicle-change", {
        type: "vehicle-change",
        action: "create",
        userId: req.user!.userId,
      });

      res.json({ vehicle });
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
      const { name, maxWeight } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const vehicle = await updateVehicle(
        String(req.params.id),
        name,
        parseFloat(maxWeight) || 0,
        imageUrl
      );
      res.json({ vehicle });
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
      const vehicle = await prisma.vehicle.findUnique({ where: { id: String(req.params.id) } });
      await deleteVehicle(String(req.params.id));

      await createLog(req.user!.userId, "VEHICLE_DELETED", {
        vehicleName: vehicle?.name || "Inconnu",
      });

      broadcast("vehicle-change", {
        type: "vehicle-change",
        action: "delete",
        userId: req.user!.userId,
      });

      res.json({ message: "Véhicule supprimé" });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// --- Vehicle Items ---

router.get(
  "/:id/items",
  async (req: AuthRequest, res: Response) => {
    try {
      const items = await getVehicleItems(String(req.params.id));
      res.json({ items });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.post(
  "/:id/items",
  requirePermission(Permission.STOCK_ADD),
  async (req: AuthRequest, res: Response) => {
    try {
      const { itemTypeId, quantity } = req.body;
      const item = await addVehicleItem(String(req.params.id), itemTypeId, quantity);
      broadcast("vehicle-change", { type: "vehicle-change", action: "item-add", userId: req.user!.userId });
      res.json({ item });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.delete(
  "/:id/items/:itemTypeId",
  requirePermission(Permission.STOCK_ADD),
  async (req: AuthRequest, res: Response) => {
    try {
      const { quantity } = req.body;
      await removeVehicleItem(
        String(req.params.id),
        String(req.params.itemTypeId),
        quantity
      );
      broadcast("vehicle-change", { type: "vehicle-change", action: "item-remove", userId: req.user!.userId });
      res.json({ message: "Objet retiré" });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// --- Positions ---

router.put(
  "/positions/update",
  requirePermission(Permission.ITEM_EDIT),
  async (req: AuthRequest, res: Response) => {
    try {
      const { positions } = req.body;
      if (!Array.isArray(positions)) {
        res.status(400).json({ error: "positions doit être un tableau" });
        return;
      }
      await updateVehiclePositions(positions);
      res.json({ message: "Positions mises à jour" });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.put(
  "/:vehicleId/item-positions",
  requirePermission(Permission.ITEM_EDIT),
  async (req: AuthRequest, res: Response) => {
    try {
      const { positions } = req.body;
      if (!Array.isArray(positions)) {
        res.status(400).json({ error: "positions doit être un tableau" });
        return;
      }
      await updateVehicleItemPositions(String(req.params.vehicleId), positions);
      broadcast("vehicle-change", { type: "vehicle-change", action: "item-reorder", userId: req.user!.userId });
      res.json({ message: "Positions mises à jour" });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

// --- Move item between inventories ---

router.post(
  "/move",
  requirePermission(Permission.STOCK_ADD),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fromType, fromId, toType, toId, itemTypeId, quantity } = req.body;

      if (!fromType || !toType || !itemTypeId || !quantity) {
        res.status(400).json({ error: "Paramètres manquants" });
        return;
      }

      await moveItemBetweenInventories(fromType, fromId, toType, toId, itemTypeId, quantity);

      const item = await prisma.itemType.findUnique({ where: { id: itemTypeId }, select: { name: true, imageUrl: true } });

      let fromName = "Inventaire";
      if (fromType === "vehicle") {
        const v = await prisma.vehicle.findUnique({ where: { id: fromId }, select: { name: true } });
        fromName = v?.name || "Véhicule";
      }

      let toName = "Inventaire";
      if (toType === "vehicle") {
        const v = await prisma.vehicle.findUnique({ where: { id: toId }, select: { name: true } });
        toName = v?.name || "Véhicule";
      }

      await createLog(req.user!.userId, "ITEM_MOVED", {
        itemName: item?.name || "Inconnu",
        imageUrl: item?.imageUrl,
        fromName,
        toName,
        quantity,
      });

      broadcast("vehicle-change", {
        type: "vehicle-change",
        action: "move",
        userId: req.user!.userId,
      });

      res.json({ message: "Objet déplacé" });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

export default router;
