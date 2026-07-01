import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileKey2, FileText, LockKeyhole } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const modules = [
  {
    href: '/templates',
    title: 'Plantillas',
    description: 'Configura los formatos usados para emitir documentos.',
    icon: FileText,
    action: 'Abrir plantillas',
  },
  {
    href: '/api-credentials',
    title: 'Claves de acceso',
    description: 'Crea claves para conectar otros sistemas autorizados.',
    icon: FileKey2,
    action: 'Gestionar claves',
  },
  {
    href: '/access',
    title: 'Usuarios',
    description: 'Administra usuarios, perfiles y permisos internos.',
    icon: LockKeyhole,
    action: 'Ver usuarios',
  },
];

export function ModuleGrid() {
  return (
    <div className="grid gap-5">
      <Card className="overflow-hidden">
        <CardHeader className="relative">
          <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-[var(--primary)] opacity-10 blur-2xl" />
          <Badge className="w-fit" variant="success">
            <CheckCircle2 size={14} />
            Servicio activo
          </Badge>
          <CardTitle className="text-3xl">Panel de manejo</CardTitle>
          <CardDescription>
            Accede a las herramientas principales para administrar documentos, usuarios y claves.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link href={module.href} key={module.href}>
              <Card className="group min-h-[230px] transition-colors hover:border-[var(--primary)]">
                <CardHeader>
                  <span className="grid h-11 w-11 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--primary)]">
                    <Icon size={22} />
                  </span>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <div className="grid gap-2">
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                  <Button className="w-fit" variant="secondary">
                    {module.action}
                    <ArrowRight className="transition-transform group-hover:translate-x-0.5" size={15} />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
