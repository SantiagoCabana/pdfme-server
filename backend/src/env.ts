import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().optional(),
  WEB_APP_URL: z.string().url().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  INITIAL_ADMIN_EMAIL: z.string().email().optional(),
  INITIAL_ADMIN_PASSWORD: z.string().min(8).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_COOKIE_NAME: z.string().min(1).optional(),
  AUTH_COOKIE_MAX_AGE_SECONDS: z.coerce.number().positive().optional(),
  API_KEY_SECRET: z.string().min(32).optional(),
  NODE_ENV: z.string().default('development'),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  API_PORT: parsed.API_PORT ?? 4000,
  WEB_APP_URL: parsed.WEB_APP_URL ?? 'http://localhost:5173',
  AUTH_SECRET: parsed.AUTH_SECRET ?? 'replace-this-with-a-32-byte-auth-secret',
  AUTH_COOKIE_NAME: parsed.AUTH_COOKIE_NAME ?? 'pdfme_auth',
  AUTH_COOKIE_MAX_AGE_SECONDS: parsed.AUTH_COOKIE_MAX_AGE_SECONDS ?? 60 * 60 * 12,
  API_KEY_SECRET: parsed.API_KEY_SECRET ?? parsed.AUTH_SECRET ?? 'replace-this-with-a-32-byte-api-secret',
};
