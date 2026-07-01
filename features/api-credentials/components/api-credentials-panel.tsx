'use client';

import { useState } from 'react';
import { Ban, CalendarClock, Plus, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApiCredentialItem } from '../server/api-credentials.service';

type ApiCredentialsPanelProps = {
  initialCredentials: ApiCredentialItem[];
};

function buildExpiryDate(mode: string) {
  if (mode === 'never') {
    return null;
  }

  const date = new Date();
  const days = Number(mode);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Nunca';
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(value));
}

export function ApiCredentialsPanel({ initialCredentials }: ApiCredentialsPanelProps) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Servicio de documentos');
  const [expiryMode, setExpiryMode] = useState('never');
  const [generatedKey, setGeneratedKey] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  function closeModal() {
    setOpen(false);
    setGeneratedKey('');
    setError('');
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    setGeneratedKey('');

    try {
      const response = await fetch('/api/api-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, expiresAt: buildExpiryDate(expiryMode) }),
      });

      const payload = (await response.json()) as {
        message?: string;
        credential?: ApiCredentialItem;
        rawKey?: string;
      };

      if (!response.ok || !payload.credential || !payload.rawKey) {
        setError(payload.message ?? 'No se pudo crear la clave.');
        return;
      }

      setCredentials((current) => [payload.credential!, ...current]);
      setGeneratedKey(payload.rawKey);
    } catch {
      setError('No se pudo crear la clave.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Claves API</CardTitle>
            <CardDescription>Acceso externo completo, con expiracion y revocacion.</CardDescription>
          </div>
          <Button onClick={() => setOpen(true)} type="button">
            <Plus size={15} />
            Nueva clave
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="dataTable min-w-[760px]">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Identificador</th>
                  <th>Estado</th>
                  <th>Expira</th>
                  <th>Ultimo uso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {credentials.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No hay claves registradas.</td>
                  </tr>
                ) : (
                  credentials.map((credential) => (
                    <tr key={credential.id}>
                      <td>{credential.name}</td>
                      <td>{credential.prefix}</td>
                      <td>
                        <Badge variant={credential.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {credential.status === 'ACTIVE' ? 'Activa' : credential.status}
                        </Badge>
                      </td>
                      <td>
                        <CalendarClock className="mr-2 inline text-[var(--muted-foreground)]" size={14} />
                        {formatDate(credential.expiresAt)}
                      </td>
                      <td>{formatDate(credential.lastUsedAt)}</td>
                      <td>
                        <Button disabled size="sm" type="button" variant="outline">
                          <Ban size={14} />
                          Revocar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {open ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard">
            <div className="modalHeader">
              <div>
                <h3>Nueva clave API</h3>
                <p>Acceso completo para integraciones externas.</p>
              </div>
              <Button onClick={closeModal} size="icon" type="button" variant="ghost">
                <X size={16} />
              </Button>
            </div>

            <form className="stackForm" onSubmit={handleCreate}>
              <label className="fieldStack">
                <span>Nombre</span>
                <input className="textField" onChange={(event) => setName(event.target.value)} value={name} />
              </label>

              <label className="fieldStack">
                <span>Expiracion</span>
                <select className="textField" onChange={(event) => setExpiryMode(event.target.value)} value={expiryMode}>
                  <option value="never">Nunca expira</option>
                  <option value="7">7 dias</option>
                  <option value="30">30 dias</option>
                  <option value="90">90 dias</option>
                  <option value="365">1 ano</option>
                </select>
              </label>

              {error ? <p className="errorText">{error}</p> : null}

              {generatedKey ? (
                <div className="secretPanel compactSecretPanel">
                  <strong>Clave generada</strong>
                  <code>{generatedKey}</code>
                  <p>Guardala ahora. No se volvera a mostrar completa.</p>
                </div>
              ) : null}

              <div className="modalActions">
                <Button onClick={closeModal} type="button" variant="outline">
                  Cerrar
                </Button>
                <Button disabled={pending || Boolean(generatedKey)} type="submit">
                  {pending ? 'Creando...' : 'Crear clave'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
