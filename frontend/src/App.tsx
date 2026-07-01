import './App.css';

const backendUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export default function App() {
  return (
    <main className="appShell">
      <section className="appCard">
        <span className="eyebrow">Pdfme Server</span>
        <h1>Frontend operativo</h1>
        <p>
          Esta URL queda para la interfaz React/Vite. El backend queda separado en
          <code>{backendUrl}</code> para API y servicios internos.
        </p>
        <div className="linkGrid">
          <a href={`${backendUrl}/api/health`} target="_blank" rel="noreferrer">
            Ver health backend
          </a>
        </div>
      </section>
    </main>
  );
}
