import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.use(authMiddleware);

router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { itemTypes: true } } },
    });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post(
  "/",
  requirePermission(Permission.ITEM_CREATE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: "Le nom est requis" });
        return;
      }

      const existing = await prisma.category.findUnique({ where: { name } });
      if (existing) {
        res.status(400).json({ error: "Cette catégorie existe déjà" });
        return;
      }

      const category = await prisma.category.create({ data: { name } });
      res.status(201).json({ category });
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
      const items = await prisma.itemType.count({ where: { categoryId: id } });
      if (items > 0) {
        res.status(400).json({
          error: "Impossible de supprimer une catégorie qui contient des objets",
        });
        return;
      }
      await prisma.category.delete({ where: { id } });
      res.json({ message: "Catégorie supprimée" });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

export default router;
