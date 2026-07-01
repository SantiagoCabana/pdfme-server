import { AccessManagementPanel } from '@/features/access/components/access-management-panel';
import { getAccessOverview } from '@/features/access/server/access.service';
import { ProtectedPageShell } from '@/features/dashboard/components/protected-page-shell';

export const dynamic = 'force-dynamic';

export default async function AccessPage() {
  const overview = await getAccessOverview();

  return (
    <ProtectedPageShell>
      <AccessManagementPanel
        permissions={overview.permissions}
        users={overview.users}
      />
    </ProtectedPageShell>
  );
}
