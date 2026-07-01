'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileKey2, FileText, LockKeyhole, LogOut, Moon, Sun } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const navigation = [
  {
    href: '/templates',
    label: 'Plantillas',
    description: 'Formatos de documentos',
    icon: FileText,
  },
  {
    href: '/access',
    label: 'Usuarios',
    description: 'Perfiles y permisos',
    icon: LockKeyhole,
  },
  {
    href: '/api-credentials',
    label: 'Claves de acceso',
    description: 'Sistemas autorizados',
    icon: FileKey2,
  },
];

type DashboardShellProps = {
  children: React.ReactNode;
  session: {
    displayName: string;
    email: string;
    roles: string[];
  };
};

type ThemeMode = 'light' | 'dark';

export function DashboardShell({ children, session }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingLogout, setPendingLogout] = useState(false);
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const savedMode = window.localStorage.getItem('pdfme-theme');
    return savedMode === 'dark' || savedMode === 'light' ? savedMode : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.classList.toggle('dark', mode === 'dark');
    window.localStorage.setItem('pdfme-theme', mode);
  }, [mode]);

  async function handleLogout() {
    setPendingLogout(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
      setPendingLogout(false);
    }
  }

  const navLinks = navigation.map((item) => {
    const Icon = item.icon;
    const active = pathname === item.href || (pathname === '/dashboard' && item.href === '/templates');

    return (
      <Link
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]',
          active && 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary-hover)] hover:text-[var(--primary-foreground)]',
        )}
        href={item.href}
        key={item.href}
      >
        <Icon size={17} />
        <span>{item.label}</span>
      </Link>
    );
  });

  return (
    <div className="h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="grid h-full lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="hidden h-screen min-h-0 border-r border-[var(--border)] bg-[var(--sidebar)] lg:block">
          <div className="hide-scrollbar flex h-full min-h-0 flex-col overflow-y-auto px-4 py-5">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-11 w-11">PS</Avatar>
              <div>
                <strong className="block text-sm">Pdfme Server</strong>
                <span className="text-xs text-[var(--muted-foreground)]">Panel administrativo</span>
              </div>
            </div>

            <nav className="mt-5 grid gap-1">{navLinks}</nav>

            <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {mode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  <span className="text-sm font-medium">Modo {mode === 'dark' ? 'oscuro' : 'claro'}</span>
                </div>
                <Switch checked={mode === 'dark'} onCheckedChange={(checked) => setMode(checked ? 'dark' : 'light')} />
              </div>
            </div>

            <div className="mt-auto grid gap-4 pt-5">
              <Separator />
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                <Avatar>{session.displayName.slice(0, 1).toUpperCase()}</Avatar>
                <div className="min-w-0">
                  <strong className="block truncate text-sm">{session.displayName}</strong>
                  <span className="block truncate text-xs text-[var(--muted-foreground)]">{session.email}</span>
                </div>
                <Button disabled={pendingLogout} onClick={handleLogout} size="icon" title="Cerrar sesion" variant="ghost">
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <main className="h-screen min-h-0 min-w-0 overflow-hidden">
          <header className="border-b border-[var(--border)] bg-[var(--sidebar)] p-3 lg:hidden">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9">PS</Avatar>
                <strong className="text-sm">Pdfme Server</strong>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={mode === 'dark'} onCheckedChange={(checked) => setMode(checked ? 'dark' : 'light')} />
                <Button disabled={pendingLogout} onClick={handleLogout} size="icon" title="Cerrar sesion" variant="ghost">
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
            <nav className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">{navLinks}</nav>
          </header>

          <section className="h-[calc(100vh-124px)] overflow-y-auto bg-[var(--background)] p-4 md:p-6 lg:h-full lg:p-7">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
