import { env } from '../env.js';
import { prisma } from '../prisma.js';
import { verifyPassword } from './password.js';

export type AdminSessionUser = {
  email: string;
  title: string;
  id: string;
};

export async function authenticateAdmin(email: string, password: string): Promise<AdminSessionUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === env.ADMIN_EMAIL.toLowerCase() && password === env.ADMIN_PASSWORD) {
    return { id: 'bootstrap-admin', email: env.ADMIN_EMAIL, title: 'Bootstrap Admin' };
  }

  const user = await prisma.userAccount.findUnique({ where: { email: normalizedEmail } }).catch(() => null);

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    return null;
  }

  return { id: user.id, email: user.email, title: user.displayName };
}
