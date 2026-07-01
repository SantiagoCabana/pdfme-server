'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Save, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AccessUserItem, AccessUserRank, SimplePermissionId, SimplePermissionItem } from '../server/access.service';

type AccessManagementPanelProps = {
  permissions: SimplePermissionItem[];
  users: AccessUserItem[];
};

export function AccessManagementPanel({ permissions, users: initialUsers }: AccessManagementPanelProps) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUserId, setSelectedUserId] = useState(initialUsers[0]?.id ?? '');
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const [rank, setRank] = useState<AccessUserRank>(selectedUser?.rank ?? 'USER');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<SimplePermissionId[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setRank(selectedUser?.rank ?? 'USER');
    setSelectedPermissionIds(selectedUser?.permissions.map((permission) => permission.id) ?? []);
    setMessage('');
  }, [selectedUser]);

  const selectedPermissionSet = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds]);

  function togglePermission(permissionId: SimplePermissionId) {
    setSelectedPermissionIds((current) =>
      current.includes(permissionId) ? current.filter((item) => item !== permissionId) : [...current, permissionId],
    );
  }

  async function handleSave() {
    if (!selectedUser) {
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`/api/access/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rank, permissionIds: selectedPermissionIds }),
      });
      const payload = (await response.json()) as { message?: string; user?: AccessUserItem };

      if (!response.ok || !payload.user) {
        setMessage(payload.message ?? 'No se pudo guardar.');
        return;
      }

      setUsers((current) => current.map((user) => (user.id === payload.user!.id ? payload.user! : user)));
      setMessage('Cambios guardados.');
    } catch {
      setMessage('No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_390px]">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>Administra usuarios, rango y accesos principales.</CardDescription>
          </div>
          <Button disabled>
            <Plus size={15} />
            Nuevo usuario
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="dataTable min-w-[760px]">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rango</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const active = selectedUser?.id === user.id;

                  return (
                    <tr className={active ? 'isSelectedTableRow' : undefined} key={user.id}>
                      <td>
                        <button className="userCellButton" onClick={() => setSelectedUserId(user.id)} type="button">
                          <span className="userCellIcon">
                            <UserRound size={16} />
                          </span>
                          <span>
                            <strong>{user.displayName}</strong>
                            <small>{user.rank === 'ADMIN' ? 'Administrador' : 'Usuario'}</small>
                          </span>
                        </button>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <Badge variant={user.rank === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.rank === 'ADMIN' ? 'Admin' : 'User'}
                        </Badge>
                      </td>
                      <td>{user.status === 'ACTIVE' ? 'Activo' : user.status}</td>
                      <td>
                        <Button onClick={() => setSelectedUserId(user.id)} size="sm" type="button" variant="outline">
                          <Edit3 size={14} />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Editar usuario</CardTitle>
              <CardDescription>{selectedUser?.displayName ?? 'Selecciona un usuario.'}</CardDescription>
            </div>
            {selectedUser ? <Badge variant={rank === 'ADMIN' ? 'default' : 'secondary'}>{rank === 'ADMIN' ? 'Admin' : 'User'}</Badge> : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <label className="fieldStack">
            <span>Rango</span>
            <select className="textField" onChange={(event) => setRank(event.target.value as AccessUserRank)} value={rank}>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
          </label>

          <div className="permissionEditorList">
            {permissions.map((permission) => {
              const checked = selectedPermissionSet.has(permission.id);

              return (
                <label className={cn('permissionEditorItem', checked && 'isChecked')} key={permission.id}>
                  <input checked={checked} onChange={() => togglePermission(permission.id)} type="checkbox" />
                  <span>
                    <strong>{permission.label}</strong>
                    <small>{permission.description}</small>
                  </span>
                </label>
              );
            })}
          </div>

          {message ? <p className={message.includes('guardados') ? 'successText' : 'errorText'}>{message}</p> : null}

          <Button disabled={!selectedUser || saving} onClick={handleSave} type="button">
            <Save size={15} />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
