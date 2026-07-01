import cors from 'cors';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

import { env } from './env.js';
import { apiCredentialsRouter } from './routes/api-credentials.route.js';
import { authRouter } from './routes/auth.route.js';
import { healthRouter } from './routes/health.route.js';
import { renderRouter } from './routes/render.route.js';
import { templatesRouter } from './routes/templates.route.js';

const app = express();
const PgSession = connectPgSimple(session);

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(session({
  store: new PgSession({ conString: env.DATABASE_URL, createTableIfMissing: true }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: env.SESSION_COOKIE_NAME,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  },
}));

app.get('/', (_request, response) => {
  response.json({ ok: true, service: 'pdfme-server-api' });
});

app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', apiCredentialsRouter);
app.use('/api', templatesRouter);
app.use('/api', renderRouter);

app.listen(env.BACKEND_PORT, () => {
  console.log(`Backend API listo en http://localhost:${env.BACKEND_PORT}`);
});
