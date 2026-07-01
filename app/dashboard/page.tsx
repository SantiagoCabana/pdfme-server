import { ProtectedPageShell } from '@/features/dashboard/components/protected-page-shell';
import { TemplateCatalogPanel } from '@/features/templates/components/template-catalog-panel';
import { getTemplateOverview } from '@/features/templates/server/templates.service';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const overview = await getTemplateOverview();

  return (
    <ProtectedPageShell>
      <TemplateCatalogPanel templates={overview.templates} />
    </ProtectedPageShell>
  );
}
