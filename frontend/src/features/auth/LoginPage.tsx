import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LockOutlined, LoginOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Avatar, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

import { useAppContext } from '../../app/AppContext';
import type { SessionUser } from '../../app/types';
import { apiRequest } from '../../shared/api/client';

export function LoginPage() {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('practissac.cursos@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/templates" replace />;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      const payload = await apiRequest<{ user: SessionUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(payload.user);
      navigate('/templates', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.25} component="form" onSubmit={submit}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Avatar variant="rounded" sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>PS</Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary">Pdfme Server</Typography>
                <Typography variant="h4">Iniciar sesion</Typography>
              </Box>
            </Stack>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField label="Correo" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
            <TextField label="Contrasena" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
            <Button disabled={pending} size="large" startIcon={<LoginOutlined />} type="submit" variant="contained">{pending ? 'Entrando...' : 'Entrar'}</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
