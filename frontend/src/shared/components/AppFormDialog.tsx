import type { FormEvent, ReactNode } from 'react';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

type AppFormDialogProps = {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  onClose: () => void;
  open: boolean;
  title?: string;
};

export function AppFormDialog({ actions, children, description, maxWidth = 'sm', onClose, open, title }: AppFormDialogProps) {
  return (
    <Dialog
      fullWidth
      maxWidth={maxWidth}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { borderRadius: 2 } } }}
    >
      {title ? (
        <DialogTitle sx={{ pb: description ? 0.75 : 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</Typography>
            {description ? (
              <Typography color="text.secondary" sx={{ fontSize: '0.78rem', mt: 0.5 }}>
                {description}
              </Typography>
            ) : null}
          </Box>
        </DialogTitle>
      ) : null}
      <DialogContent dividers sx={{ px: 3, py: 2.25 }}>
        {children}
      </DialogContent>
      {actions ? <DialogActions sx={{ gap: 1, px: 3, py: 2 }}>{actions}</DialogActions> : null}
    </Dialog>
  );
}

type FormFieldStackProps = {
  children: ReactNode;
  id?: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export function FormFieldStack({ children, id, onSubmit }: FormFieldStackProps) {
  return (
    <Stack component="form" id={id} onSubmit={onSubmit} spacing={2}>
      {children}
    </Stack>
  );
}
