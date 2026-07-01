import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    window.location.replace('/admin');
  }, []);

  return (
    <main className="redirectShell">
      <section className="redirectCard">
        <span>Pdfme Server</span>
        <h1>Redirigiendo al panel principal</h1>
        <p>AdminJS es la interfaz principal de la plataforma.</p>
        <a href="/admin">Abrir AdminJS</a>
      </section>
    </main>
  );
}
