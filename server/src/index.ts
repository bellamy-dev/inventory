import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env";
import { corsOptions } from "./config/cors";
import { errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import roleRoutes from "./routes/roles";
import categoryRoutes from "./routes/categories";
import rarityRoutes from "./routes/rarities";
import itemTypeRoutes from "./routes/itemTypes";
import stockRoutes from "./routes/stock";
import saleRoutes from "./routes/sales";
import logRoutes from "./routes/logs";
import webhookRoutes from "./routes/webhook";

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/rarities", rarityRoutes);
app.use("/api/items", itemTypeRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/webhook", webhookRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
