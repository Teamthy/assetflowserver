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
	  REQUEST_BODY_LIMIT: z.string().default("256kb"),
	  TRUST_PROXY: z
	    .string()
	    .optional()
	    .transform((value) => value === "true")
	    .default(false),
	  PG_POOL_MAX: z.coerce.number().int().positive().default(10),
	  PG_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
	  PG_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(2_000),
	  PG_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
	  ASSET_IMPORT_MAX_FILE_BYTES: z.coerce
	    .number()
	    .int()
	    .positive()
	    .default(10 * 1024 * 1024),
	  ASSET_IMPORT_MAX_ROWS: z.coerce.number().int().positive().default(5_000),
  JWT_SECRET: secretSchema("dev-jwt-secret-change-me-12345"),
  JWT_REFRESH_SECRET: secretSchema("dev-jwt-refresh-secret-change-me-12345"),
  TOKEN_HASH_PEPPER: secretSchema("dev-token-hash-pepper-change-me-12345"),
  JWT_ISSUER: z.string().min(1).default("asset-management-api"),
  JWT_AUDIENCE: z.string().min(1).default("asset-management-client"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("30m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3000,http://localhost:8080")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  FRONTEND_URL: z.string().url().default("http://localhost:8080"),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.email(),
  SUPPORT_EMAIL: z.email().default("support@example.com"),
  PG_SSL_CA_CERT: z.string().optional(),
  LOG_OTP_FOR_DEBUG: z
    .string()
    .optional()
    .transform((value) => value === "true")
    .default(false),
});

export const env = envSchema.parse(process.env);
