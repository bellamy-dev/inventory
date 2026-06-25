import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  PORT: z.coerce.number().default(3001),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  DISCORD_CLIENT_ID: z.string().default(""),
  DISCORD_CLIENT_SECRET: z.string().default(""),
  DISCORD_BOT_TOKEN: z.string().default(""),
  DISCORD_GUILD_ID: z.string().default(""),
  DISCORD_REQUIRED_ROLE_ID: z.string().default(""),
  DISCORD_REDIRECT_URI: z.string().default("http://localhost:3001/api/auth/discord/callback"),
});

export const env = envSchema.parse(process.env);
