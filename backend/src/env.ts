import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BACKEND_PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  SESSION_SECRET: z.string().min(16).default('change-this-session-secret'),
  SESSION_COOKIE_NAME: z.string().min(1).default('pdfme_session'),
  API_KEY_SECRET: z.string().min(16).default('change-this-api-key-secret'),
  NODE_ENV: z.string().default('development'),
});

export const env = envSchema.parse(process.env);
