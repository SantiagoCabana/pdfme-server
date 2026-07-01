import type { Metadata } from 'next';

import 'antd/dist/reset.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pdfme Server',
  description: 'Servidor de plantillas PDF, usuarios y claves de acceso.',
};

const themeScript = `
  try {
    var theme = localStorage.getItem('pdfme-theme') || 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (_) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
