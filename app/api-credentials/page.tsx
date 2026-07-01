import { ApiCredentialsPanel } from '@/features/api-credentials/components/api-credentials-panel';
import { getApiCredentialOverview } from '@/features/api-credentials/server/api-credentials.service';
import { ProtectedPageShell } from '@/features/dashboard/components/protected-page-shell';

export const dynamic = 'force-dynamic';

export default async function ApiCredentialsPage() {
  const overview = await getApiCredentialOverview();

  return (
    <ProtectedPageShell>
      <ApiCredentialsPanel initialCredentials={overview.credentials} />
    </ProtectedPageShell>
  );
}
