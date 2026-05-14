import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const secretSchema = (fallback: string) =>
  isProduction ? z.string().min(16) : z.string().min(16).default(fallback);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(6000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: secretSchema("dev-jwt-secret-change-me-12345"),
  JWT_REFRESH_SECRET: secretSchema("dev-jwt-refresh-secret-change-me-12345"),
  TOKEN_HASH_PEPPER: secretSchema("dev-token-hash-pepper-change-me-12345"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
