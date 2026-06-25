import { Request, Response, NextFunction } from "express";
import multer from "multer";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "L'image est trop volumineuse (max 10 Mo)" });
      return;
    }
    res.status(400).json({ error: `Erreur upload: ${err.message}` });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Erreur interne du serveur" });
}
