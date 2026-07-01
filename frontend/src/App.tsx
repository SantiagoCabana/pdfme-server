import { useEffect, useState } from 'react';
import { KeyRound, LogOut, Plus, Trash2 } from 'lucide-react';

import { apiRequest } from './shared/api/client';
import './App.css';

type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  permissions: string[];
};

type TemplateItem = {
  id: string;
  name: string;
  code: string;
  status: string;
  versionNumber: number;
  pageCount: number;
  pageFormat: string;
  pageOrientation: string;
  tags: string[];
};

type ApiCredential = {
  id: string;
  name: string;
  prefix: string;
  status: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
};

function can(user: SessionUser | null, permission: string) {
  return Boolean(user?.permissions.includes('*') || user?.permissions.includes(permission));
}

function formatDate(value: string | null) {
  if (!value) return 'Nunca';
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function buildExpiryDate(mode: string) {
  if (mode === 'never') return null;
  const date = new Date();
  date.setDate(date.getDate() + Number(mode));
  return date.toISOString();
}

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [email, setEmail] = useState('practisac.cursos@gmail.com');
  const [password, setPassword] = useState('');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateTags, setTemplateTags] = useState('');
  const [credentialName, setCredentialName] = useState('Servicio de documentos');
  const [expiryMode, setExpiryMode] = useState('never');
  const [generatedKey, setGeneratedKey] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadSession() {
    try {
      const payload = await apiRequest<{ user: SessionUser }>('/api/auth/me');
      setUser(payload.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    const requests: Promise<void>[] = [];

    if (can(user, 'templates.read')) {
      requests.push(apiRequest<{ data: TemplateItem[] }>('/api/templates').then((payload) => setTemplates(payload.data)));
    }

    if (can(user, 'api-credentials.read')) {
      requests.push(apiRequest<{ data: ApiCredential[] }>('/api/api-credentials').then((payload) => setCredentials(payload.data)));
    }

    await Promise.all(requests).catch((error) => setMessage(error instanceof Error ? error.message : 'No se pudieron cargar datos.'));
  }

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    if (user) void loadData();
  }, [user]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    try {
      const payload = await apiRequest<{ user: SessionUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(payload.user);
      setPassword('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion.');
    }
  }

  async function handleLogout() {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    setTemplates([]);
    setCredentials([]);
  }

  async function createTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    try {
      await apiRequest('/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: templateName,
          tagNames: templateTags.split(',').map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      setTemplateName('');
      setTemplateTags('');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la plantilla.');
    }
  }

  async function deleteTemplate(id: string) {
    await apiRequest(`/api/templates/${id}`, { method: 'DELETE' });
    await loadData();
  }

  async function createCredential(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setGeneratedKey('');

    try {
      const payload = await apiRequest<{ rawKey: string }>('/api/api-credentials', {
        method: 'POST',
        body: JSON.stringify({ name: credentialName, expiresAt: buildExpiryDate(expiryMode) }),
      });
      setGeneratedKey(payload.rawKey);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la clave.');
    }
  }

  async function revokeCredential(id: string) {
    await apiRequest(`/api/api-credentials/${id}/revoke`, { method: 'PATCH' });
    await loadData();
  }

  if (loading) {
    return <main className="loadingShell">Cargando...</main>;
  }

  if (!user) {
    return (
      <main className="loginShell">
        <form className="loginCard" onSubmit={handleLogin}>
          <span className="eyebrow">Pdfme Server</span>
          <h1>Iniciar sesion</h1>
          <label>
            Correo
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <label>
            Contrasena
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </label>
          {message ? <p className="errorText">{message}</p> : null}
          <button type="submit">Entrar</button>
        </form>
      </main>
    );
  }

  return (
    <main className="appLayout">
      <aside className="sidebar">
        <div className="brandBlock">
          <strong>Pdfme Server</strong>
          <span>Panel operativo</span>
        </div>
        <nav>
          <a href="#templates">Plantillas</a>
          {can(user, 'api-credentials.read') ? <a href="#api-keys">Claves API</a> : null}
        </nav>
        <div className="userBlock">
          <strong>{user.displayName}</strong>
          <span>{user.email}</span>
          <button onClick={handleLogout} type="button"><LogOut size={15} /> Salir</button>
        </div>
      </aside>

      <section className="content">
        <header className="pageHeader">
          <div>
            <span className="eyebrow">Operacion interna</span>
            <h1>Plantillas PDF</h1>
          </div>
        </header>

        {message ? <div className="alert">{message}</div> : null}

        <section className="panel" id="templates">
          <div className="panelHeader">
            <div>
              <h2>Plantillas</h2>
              <p>El frontend envia la informacion correcta y el backend crea version y pagina base.</p>
            </div>
          </div>

          {can(user, 'templates.write') ? (
            <form className="inlineForm" onSubmit={createTemplate}>
              <input placeholder="Nombre de plantilla" value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
              <input placeholder="Etiquetas separadas por coma" value={templateTags} onChange={(event) => setTemplateTags(event.target.value)} />
              <button type="submit"><Plus size={15} /> Crear</button>
            </form>
          ) : null}

          <div className="tableWrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Estado</th><th>Version</th><th>Hoja</th><th>Tags</th><th></th></tr>
              </thead>
              <tbody>
                {templates.length === 0 ? <tr><td colSpan={6}>No hay plantillas.</td></tr> : templates.map((template) => (
                  <tr key={template.id}>
                    <td><strong>{template.name}</strong><small>{template.code}</small></td>
                    <td>{template.status}</td>
                    <td>v{template.versionNumber}</td>
                    <td>{template.pageFormat} {template.pageOrientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}</td>
                    <td>{template.tags.join(', ') || 'Sin etiquetas'}</td>
                    <td>{can(user, 'templates.delete') ? <button className="iconButton" onClick={() => void deleteTemplate(template.id)} type="button"><Trash2 size={15} /></button> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {can(user, 'api-credentials.read') ? (
          <section className="panel" id="api-keys">
            <div className="panelHeader">
              <div>
                <h2>Claves API</h2>
                <p>Credenciales para sistemas externos que consumen el backend.</p>
              </div>
            </div>

            {can(user, 'api-credentials.write') ? (
              <form className="inlineForm" onSubmit={createCredential}>
                <input value={credentialName} onChange={(event) => setCredentialName(event.target.value)} />
                <select value={expiryMode} onChange={(event) => setExpiryMode(event.target.value)}>
                  <option value="never">Nunca expira</option>
                  <option value="7">7 dias</option>
                  <option value="30">30 dias</option>
                  <option value="90">90 dias</option>
                  <option value="365">1 ano</option>
                </select>
                <button type="submit"><KeyRound size={15} /> Crear clave</button>
              </form>
            ) : null}

            {generatedKey ? <div className="secretBox"><strong>Clave generada</strong><code>{generatedKey}</code></div> : null}

            <div className="tableWrap">
              <table>
                <thead>
                  <tr><th>Nombre</th><th>Identificador</th><th>Estado</th><th>Expira</th><th>Ultimo uso</th><th></th></tr>
                </thead>
                <tbody>
                  {credentials.length === 0 ? <tr><td colSpan={6}>No hay claves.</td></tr> : credentials.map((credential) => (
                    <tr key={credential.id}>
                      <td>{credential.name}</td>
                      <td>{credential.prefix}</td>
                      <td>{credential.status}</td>
                      <td>{formatDate(credential.expiresAt)}</td>
                      <td>{formatDate(credential.lastUsedAt)}</td>
                      <td>{can(user, 'api-credentials.write') && credential.status === 'ACTIVE' ? <button className="iconButton" onClick={() => void revokeCredential(credential.id)} type="button">Revocar</button> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
