import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LoginOutlined } from '@ant-design/icons';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

import { useAppContext } from '../../app/AppContext';
import type { SessionUser } from '../../app/types';
import { AppLogo } from '../../layout/AppLogo';
import { apiRequest } from '../../shared/api/client';

export function LoginPage() {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
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
          <Stack autoComplete="off" spacing={2.25} component="form" onSubmit={submit}>
            <Box sx={{ display: 'flex', justifyContent: 'center', pb: 0.5 }}>
              <AppLogo />
            </Box>
            <Typography variant="h4" sx={{ textAlign: 'center' }}>Iniciar sesion</Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField autoComplete="off" label="Correo" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
            <TextField autoComplete="new-password" label="Contrasena" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
            <Button disabled={pending} size="large" startIcon={<LoginOutlined />} type="submit" variant="contained">{pending ? 'Entrando...' : 'Entrar'}</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
