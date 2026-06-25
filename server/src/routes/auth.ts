import { Router, Request, Response } from "express";
import {
  login,
  refreshAuth,
  getCurrentUser,
  exchangeDiscordCode,
  discordLogin,
} from "../services/auth.service";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { env } from "../config/env";
import crypto from "crypto";

const router = Router();

// --- Classique login (username/password) ---

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

// --- Discord OAuth2 ---

router.get("/discord", (_req: Request, res: Response) => {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
    res.status(500).json({ error: "Discord OAuth n'est pas configuré" });
    return;
  }

  const state = crypto.randomBytes(32).toString("hex");

  res.cookie("discord_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds.members.read",
    state,
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

router.get("/discord/callback", async (req: Request, res: Response) => {
  const { code, state, error: discordError } = req.query as Record<string, string>;
  const frontendUrl = env.FRONTEND_URL;

  if (discordError) {
    res.redirect(`${frontendUrl}/discord-error?reason=denied`);
    return;
  }

  const savedState = req.cookies?.discord_oauth_state;
  res.clearCookie("discord_oauth_state");

  if (!code || !state || state !== savedState) {
    res.redirect(`${frontendUrl}/discord-error?reason=invalid_state`);
    return;
  }

  try {
    const discordUser = await exchangeDiscordCode(code);
    const result = await discordLogin(discordUser);

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

    res.redirect(`${frontendUrl}/inventaire`);
  } catch (err) {
    const message = (err as Error).message;
    if (message === "no_role") {
      res.redirect(`${frontendUrl}/discord-error?reason=no_role`);
    } else {
      console.error("Discord OAuth error:", err);
      res.redirect(`${frontendUrl}/discord-error?reason=callback_error`);
    }
  }
});

// --- Refresh / Logout / Me ---

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
