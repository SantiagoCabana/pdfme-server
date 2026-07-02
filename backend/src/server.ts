import cors from 'cors';
import express from 'express';

import { env } from './env.js';
import { apiCredentialsRouter } from './routes/api-credentials.route.js';
import { authRouter } from './routes/auth.route.js';
import { healthRouter } from './routes/health.route.js';
import { permissionsRouter } from './routes/permissions.route.js';
import { renderRouter } from './routes/render.route.js';
import { templatesRouter } from './routes/templates.route.js';
import { tagsRouter } from './routes/tags.route.js';
import { usersRouter } from './routes/users.route.js';

const app = express();

const configuredOrigins = new Set([
  env.FRONTEND_URL,
  ...(env.CORS_ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []),
]);

function isLocalDevelopmentOrigin(origin: string) {
  if (env.NODE_ENV === 'production') {
    return false;
  }

  try {
    const url = new URL(origin);
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname.startsWith('192.168.') ||
      url.hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(url.hostname)
    );
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.has(origin) || isLocalDevelopmentOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.get('/', (_request, response) => {
  response.json({ ok: true, service: 'pdfme-server-api' });
});

app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', apiCredentialsRouter);
app.use('/api', templatesRouter);
app.use('/api', tagsRouter);
app.use('/api', usersRouter);
app.use('/api', permissionsRouter);
app.use('/api', renderRouter);

app.listen(env.BACKEND_PORT, () => {
  console.log(`Backend API listo en http://localhost:${env.BACKEND_PORT}`);
});
