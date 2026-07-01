import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BACKEND_PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_COOKIE_NAME: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  SESSION_COOKIE_NAME: z.string().min(1).optional(),
  API_KEY_SECRET: z.string().min(32).optional(),
  NODE_ENV: z.string().default('development'),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  AUTH_SECRET: parsed.AUTH_SECRET ?? parsed.SESSION_SECRET ?? 'replace-this-with-a-32-byte-auth-secret',
  AUTH_COOKIE_NAME: parsed.AUTH_COOKIE_NAME ?? parsed.SESSION_COOKIE_NAME ?? 'pdfme_auth',
  API_KEY_SECRET: parsed.API_KEY_SECRET ?? parsed.AUTH_SECRET ?? parsed.SESSION_SECRET ?? 'replace-this-with-a-32-byte-api-secret',
};
