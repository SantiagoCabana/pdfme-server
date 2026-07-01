import { useEffect, useMemo, useState } from 'react';
import { FileKey2, FileText, KeyRound, LogOut, Moon, Plus, Shield, Sun, Trash2, UserRound } from 'lucide-react';

import { apiRequest } from './shared/api/client';
import './App.css';

type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  permissions: string[];
  roles: string[];
};

type TemplateItem = {
  id: string;
  name: string;
  code: string;
  status: string;
  versionNumber: number;
  isPublished: boolean;
  pageCount: number;
  pageFormat: string;
  pageOrientation: string;
  pageWidthMm: number;
  pageHeightMm: number;
  tags: string[];
  updatedAt: string;
};

type ApiCredential = {
  id: string;
  name: string;
  prefix: string;
  status: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

type InternalUser = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
};

type Section = 'templates' | 'apiKeys' | 'users';
type ThemeMode = 'light' | 'dark';

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

function statusLabel(value: string) {
  if (value === 'ACTIVE') return 'Activa';
  if (value === 'DRAFT') return 'Borrador';
  if (value === 'REVOKED') return 'Revocada';
  if (value === 'SUSPENDED') return 'Suspendido';
  return value;
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => localStorage.getItem('pdfme-theme') === 'dark' ? 'dark' : 'light');
  const [section, setSection] = useState<Section>('templates');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [email, setEmail] = useState('practisac.cursos@gmail.com');
  const [password, setPassword] = useState('');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTags, setTemplateTags] = useState('');
  const [credentialName, setCredentialName] = useState('Servicio de documentos');
  const [expiryMode, setExpiryMode] = useState('never');
  const [generatedKey, setGeneratedKey] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('VIEWER');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const navItems = useMemo(() => [
    { id: 'templates' as const, label: 'Plantillas', icon: FileText, visible: can(user, 'templates.view') },
    { id: 'apiKeys' as const, label: 'Claves API', icon: FileKey2, visible: can(user, 'api_keys.manage') },
    { id: 'users' as const, label: 'Usuarios', icon: UserRound, visible: can(user, 'users.manage') },
  ], [user]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('pdfme-theme', theme);
  }, [theme]);

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

  async function loadData(activeUser = user) {
    if (!activeUser) return;
    const tasks: Promise<void>[] = [];

    if (can(activeUser, 'templates.view')) {
      tasks.push(apiRequest<{ data: TemplateItem[] }>('/api/templates').then((payload) => setTemplates(payload.data)));
    }

    if (can(activeUser, 'api_keys.manage')) {
      tasks.push(apiRequest<{ data: ApiCredential[] }>('/api/api-credentials').then((payload) => setCredentials(payload.data)));
    }

    if (can(activeUser, 'users.manage')) {
      tasks.push(apiRequest<{ data: InternalUser[] }>('/api/users').then((payload) => setUsers(payload.data)));
    }

    await Promise.all(tasks).catch((error) => setMessage(error instanceof Error ? error.message : 'No se pudieron cargar datos.'));
  }

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    if (user) void loadData(user);
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
    setUsers([]);
  }

  async function createTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    try {
      await apiRequest('/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: templateName,
          description: templateDescription || null,
          tagNames: templateTags.split(',').map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      setTemplateName('');
      setTemplateDescription('');
      setTemplateTags('');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la plantilla.');
    }
  }

  async function publishTemplate(id: string) {
    await apiRequest(`/api/templates/${id}/publish`, { method: 'PATCH' });
    await loadData();
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

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    try {
      await apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify({ email: newUserEmail, displayName: newUserName, password: newUserPassword, roleCode: newUserRole }),
      });
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('VIEWER');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear el usuario.');
    }
  }

  if (loading) return <main className="loadingShell">Cargando...</main>;

  if (!user) {
    return (
      <main className="loginShell">
        <form className="loginCard" onSubmit={handleLogin}>
          <div className="loginBrand"><span>PS</span><strong>Pdfme Server</strong></div>
          <h1>Iniciar sesion</h1>
          <label>Correo<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label>
          <label>Contrasena<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label>
          {message ? <p className="errorText">{message}</p> : null}
          <button type="submit">Entrar</button>
        </form>
      </main>
    );
  }

  return (
    <main className="appLayout">
      <aside className="sidebar">
        <div className="brandBlock"><span>PS</span><div><strong>Pdfme Server</strong><small>Operacion interna</small></div></div>
        <nav>
          {navItems.filter((item) => item.visible).map((item) => {
            const Icon = item.icon;
            return <button className={section === item.id ? 'active' : ''} key={item.id} onClick={() => setSection(item.id)} type="button"><Icon size={17} />{item.label}</button>;
          })}
        </nav>
        <button className="themeButton" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} type="button">
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} Modo {theme === 'dark' ? 'oscuro' : 'claro'}
        </button>
        <div className="userBlock"><strong>{user.displayName}</strong><span>{user.email}</span><small>{user.roles.join(', ') || 'Sin rol'}</small><button onClick={handleLogout} type="button"><LogOut size={15} /> Salir</button></div>
      </aside>

      <section className="content">
        <header className="pageHeader"><div><span className="eyebrow">Panel privado</span><h1>{section === 'templates' ? 'Plantillas PDF' : section === 'apiKeys' ? 'Claves API' : 'Usuarios'}</h1></div></header>
        {message ? <div className="alert">{message}</div> : null}

        {section === 'templates' ? <section className="panel">
          <div className="panelHeader"><div><h2>Catalogo de plantillas</h2><p>El backend crea internamente version y pagina base por cada plantilla.</p></div></div>
          {can(user, 'templates.create') ? <form className="formGrid" onSubmit={createTemplate}>
            <input placeholder="Nombre" value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
            <input placeholder="Descripcion" value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} />
            <input placeholder="Etiquetas: certificado, rrhh" value={templateTags} onChange={(event) => setTemplateTags(event.target.value)} />
            <button type="submit"><Plus size={15} />Crear</button>
          </form> : null}
          <div className="tableWrap"><table><thead><tr><th>Plantilla</th><th>Estado</th><th>Version</th><th>Hoja</th><th>Tags</th><th>Acciones</th></tr></thead><tbody>
            {templates.length === 0 ? <tr><td colSpan={6}>No hay plantillas.</td></tr> : templates.map((template) => <tr key={template.id}>
              <td><div className="templateCell"><span className={template.pageOrientation === 'LANDSCAPE' ? 'preview landscape' : 'preview'} /><div><strong>{template.name}</strong><small>{template.code}</small></div></div></td>
              <td><span className="pill">{statusLabel(template.status)}</span></td>
              <td>v{template.versionNumber}{template.isPublished ? ' publicada' : ''}</td>
              <td>{template.pageFormat} {template.pageOrientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}</td>
              <td>{template.tags.join(', ') || 'Sin etiquetas'}</td>
              <td className="actions">{can(user, 'templates.publish') ? <button onClick={() => void publishTemplate(template.id)} type="button">Publicar</button> : null}{can(user, 'templates.delete') ? <button className="danger" onClick={() => void deleteTemplate(template.id)} type="button"><Trash2 size={14} /></button> : null}</td>
            </tr>)}
          </tbody></table></div>
        </section> : null}

        {section === 'apiKeys' && can(user, 'api_keys.manage') ? <section className="panel">
          <div className="panelHeader"><div><h2>Claves API</h2><p>Acceso externo completo con expiracion y revocacion.</p></div></div>
          <form className="formGrid compact" onSubmit={createCredential}><input value={credentialName} onChange={(event) => setCredentialName(event.target.value)} /><select value={expiryMode} onChange={(event) => setExpiryMode(event.target.value)}><option value="never">Nunca expira</option><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option><option value="365">1 ano</option></select><button type="submit"><KeyRound size={15} />Crear clave</button></form>
          {generatedKey ? <div className="secretBox"><strong>Clave generada</strong><code>{generatedKey}</code><small>Guardala ahora. No se volvera a mostrar completa.</small></div> : null}
          <div className="tableWrap"><table><thead><tr><th>Nombre</th><th>Identificador</th><th>Estado</th><th>Expira</th><th>Ultimo uso</th><th></th></tr></thead><tbody>{credentials.length === 0 ? <tr><td colSpan={6}>No hay claves.</td></tr> : credentials.map((credential) => <tr key={credential.id}><td>{credential.name}</td><td>{credential.prefix}</td><td><span className="pill">{statusLabel(credential.status)}</span></td><td>{formatDate(credential.expiresAt)}</td><td>{formatDate(credential.lastUsedAt)}</td><td>{credential.status === 'ACTIVE' ? <button onClick={() => void revokeCredential(credential.id)} type="button">Revocar</button> : null}</td></tr>)}</tbody></table></div>
        </section> : null}

        {section === 'users' && can(user, 'users.manage') ? <section className="panel">
          <div className="panelHeader"><div><h2>Usuarios internos</h2><p>Solo admins crean accesos. No existe registro publico.</p></div><Shield size={22} /></div>
          <form className="formGrid" onSubmit={createUser}><input placeholder="Nombre" value={newUserName} onChange={(event) => setNewUserName(event.target.value)} /><input placeholder="Correo" value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} type="email" /><input placeholder="Contrasena inicial" value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} type="password" /><select value={newUserRole} onChange={(event) => setNewUserRole(event.target.value)}><option value="VIEWER">Viewer</option><option value="EDITOR">Editor</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select><button type="submit"><Plus size={15} />Crear usuario</button></form>
          <div className="tableWrap"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Ultimo acceso</th></tr></thead><tbody>{users.length === 0 ? <tr><td colSpan={4}>No hay usuarios.</td></tr> : users.map((item) => <tr key={item.id}><td><strong>{item.displayName}</strong><small>{item.email}</small></td><td>{item.roles.join(', ') || 'Sin rol'}</td><td><span className="pill">{statusLabel(item.status)}</span></td><td>{formatDate(item.lastLoginAt)}</td></tr>)}</tbody></table></div>
        </section> : null}
      </section>
    </main>
  );
}
