import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/permission";
import { Permission } from "../types";
import {
  getWebhookConfig,
  updateWebhookConfig,
  sendTestWebhook,
} from "../services/webhook.service";
import { createLog } from "../services/log.service";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  requirePermission(Permission.WEBHOOK_CONFIGURE),
  async (_req: AuthRequest, res: Response) => {
    try {
      const config = await getWebhookConfig();
      res.json({ config });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

router.put(
  "/",
  requirePermission(Permission.WEBHOOK_CONFIGURE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { discordUrl, saleEvents, itemEvents, harvestEvents } = req.body;
      const config = await updateWebhookConfig({
        discordUrl,
        saleEvents,
        itemEvents,
        harvestEvents,
      });

      await createLog(req.user!.userId, "WEBHOOK_UPDATED", {
        discordUrl: discordUrl ? "Configuré" : "Non configuré",
        saleEvents,
        itemEvents,
        harvestEvents,
      });

      res.json({ config });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

router.post(
  "/test",
  requirePermission(Permission.WEBHOOK_CONFIGURE),
  async (_req: AuthRequest, res: Response) => {
    try {
      const success = await sendTestWebhook();
      if (success) {
        res.json({ message: "Message de test envoyé avec succès" });
      } else {
        res.status(400).json({ error: "Échec de l'envoi du message de test" });
      }
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

export default router;
