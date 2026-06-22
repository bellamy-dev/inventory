import { Router, Request, Response } from "express";
import { login, refreshAuth, getCurrentUser } from "../services/auth.service";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Pseudo et mot de passe requis" });
      return;
    }

    const result = await login(username, password);

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ user: result.user });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: "Refresh token manquant" });
      return;
    }

    const result = await refreshAuth(refreshToken);

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: result.user });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Déconnecté avec succès" });
});

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user = await getCurrentUser(authReq.user!.userId);
    res.json({ user });
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

export default router;
