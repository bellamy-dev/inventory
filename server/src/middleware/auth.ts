import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { JwtPayload } from "../types";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.accessToken;

  if (!token) {
    res.status(401).json({ error: "Token d'authentification manquant" });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
