import { Box, CircularProgress, Stack, Typography } from '@mui/material';

type LoadingStateProps = {
  label?: string;
  minHeight?: number | string;
};

export function LoadingState({ label = 'Cargando...', minHeight = 240 }: LoadingStateProps) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'grid',
        flexGrow: 1,
        minHeight,
        placeItems: 'center',
        width: '100%',
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
        <CircularProgress size={24} thickness={4} />
        <Typography variant="caption">{label}</Typography>
      </Stack>
    </Box>
  );
}

export function AppBootLoader() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <LoadingState label="Preparando sesion..." minHeight="100vh" />
    </Box>
  );
}
