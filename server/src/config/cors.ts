import cors from "cors";
import { env } from "./env";

export const corsOptions: cors.CorsOptions = {
  origin: env.FRONTEND_URL,
  credentials: true,
};
