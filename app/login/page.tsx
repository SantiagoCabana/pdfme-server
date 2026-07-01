import { redirect } from 'next/navigation';

import { LoginForm } from '@/features/auth/components/login-form';
import { getSession } from '@/features/auth/session';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect('/templates');
  }

  return (
    <main className="loginShell">
      <LoginForm />
    </main>
  );
}
