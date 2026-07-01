import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { buildAuthenticatedRouter } from '@adminjs/express';

import { createAdmin } from './admin/admin.js';
import { authenticateAdmin } from './auth/admin-auth.js';
import { env } from './env.js';
import { apiCredentialsRouter } from './routes/api-credentials.route.js';
import { healthRouter } from './routes/health.route.js';
import { renderRouter } from './routes/render.route.js';
import { templatesRouter } from './routes/templates.route.js';

const app = express();
const admin = createAdmin();
const PgSession = connectPgSimple(session);

app.use(express.json({ limit: '10mb' }));

const sessionOptions: session.SessionOptions = {
  store: new PgSession({ conString: env.DATABASE_URL, createTableIfMissing: true }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: env.ADMIN_COOKIE_NAME,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  },
};

app.use(session({
  ...sessionOptions,
  secret: env.SESSION_SECRET,
  name: env.ADMIN_COOKIE_NAME,
}));

app.use('/api', healthRouter);
app.use('/api', apiCredentialsRouter);
app.use('/api', templatesRouter);
app.use('/api', renderRouter);

const adminRouter = buildAuthenticatedRouter(
  admin,
  {
    authenticate: authenticateAdmin,
    cookieName: env.ADMIN_COOKIE_NAME,
    cookiePassword: env.SESSION_SECRET,
  },
  null,
  sessionOptions,
);

app.use(admin.options.rootPath, adminRouter);

app.listen(env.BACKEND_PORT, () => {
  console.log(`Backend listo en http://localhost:${env.BACKEND_PORT}`);
  console.log(`Panel AdminJS listo en http://localhost:${env.BACKEND_PORT}${admin.options.rootPath}`);
});
