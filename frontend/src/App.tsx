import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    window.location.replace(import.meta.env.VITE_ADMIN_URL ?? 'http://localhost:4000');
  }, []);

  return (
    <main className="redirectShell">
      <section className="redirectCard">
        <span>Pdfme Server</span>
        <h1>Redirigiendo al panel principal</h1>
        <p>AdminJS es la interfaz principal de la plataforma.</p>
        <a href={import.meta.env.VITE_ADMIN_URL ?? 'http://localhost:4000'}>Abrir panel</a>
      </section>
    </main>
  );
}
