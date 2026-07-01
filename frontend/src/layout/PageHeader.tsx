import { Box, Stack, Typography } from '@mui/material';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="h3">{title}</Typography>
        {subtitle ? <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography> : null}
      </Box>
      {action}
    </Stack>
  );
}
