import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.use(authMiddleware);

router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const rarities = await prisma.rarity.findMany({
      orderBy: { position: "asc" },
    });
    res.json({ rarities });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, color, position } = req.body;
    if (!name) {
      res.status(400).json({ error: "Le nom est requis" });
      return;
    }

    const existing = await prisma.rarity.findUnique({ where: { name } });
    if (existing) {
      res.status(400).json({ error: "Cette rareté existe déjà" });
      return;
    }

    const last = await prisma.rarity.findFirst({
      orderBy: { position: "desc" },
    });
    const nextPos = position ?? (last ? last.position + 1 : 0);

    const rarity = await prisma.rarity.create({
      data: { name, color: color || "#9ca3af", position: nextPos },
    });
    res.status(201).json({ rarity });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, color, position } = req.body;
    const rarity = await prisma.rarity.update({
      where: { id },
      data: { name, color, position },
    });
    res.json({ rarity });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const items = await prisma.itemType.count({ where: { rarityId: id } });
    if (items > 0) {
      res.status(400).json({
        error: "Impossible de supprimer une rareté utilisée par des objets",
      });
      return;
    }
    await prisma.rarity.delete({ where: { id } });
    res.json({ message: "Rareté supprimée" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
