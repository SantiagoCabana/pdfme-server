import { requireInternalSession } from '@/features/auth/server/auth.service';
import { DashboardShell } from './dashboard-shell';

export async function ProtectedPageShell({ children }: { children: React.ReactNode }) {
  const session = await requireInternalSession();

  return (
    <DashboardShell
      session={{
        displayName: session.displayName,
        email: session.email,
        roles: session.roles,
      }}
    >
      {children}
    </DashboardShell>
  );
}
