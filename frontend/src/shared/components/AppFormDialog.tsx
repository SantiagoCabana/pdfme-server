import type { FormEvent, ReactNode } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

type AppFormDialogProps = {
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  onClose: () => void;
  open: boolean;
  title?: string;
};

export function AppFormDialog({ actions, children, maxWidth = 'sm', onClose, open, title }: AppFormDialogProps) {
  const fieldSx = {
    '& .MuiInputBase-root': {
      minHeight: 42,
    },
    '& .MuiInputBase-input': {
      fontSize: '0.84rem',
      height: '1.35rem',
      lineHeight: '1.35rem',
      py: '9px',
    },
    '& .MuiInputBase-input::placeholder': {
      lineHeight: '1.35rem',
      opacity: 0.72,
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.84rem',
    },
    '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
      transform: 'translate(14px, 10px) scale(1)',
    },
    '& .MuiInputLabel-shrink': {
      fontSize: '0.9rem',
    },
    '& .MuiFormHelperText-root': {
      fontSize: '0.72rem',
      mt: 0.5,
    },
    '& .MuiAutocomplete-inputRoot': {
      py: '4px !important',
    },
    '& .MuiSelect-select': {
      alignItems: 'center',
      display: 'flex',
      lineHeight: '1.35rem',
      minHeight: '1.35rem !important',
      py: '9px !important',
    },
  };

  return (
    <Dialog
      fullWidth
      maxWidth={maxWidth}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { borderRadius: 2 } } }}
    >
      {title ? (
        <DialogTitle sx={{ pb: 1.5 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</Typography>
        </DialogTitle>
      ) : null}
      <DialogContent dividers sx={{ px: 3, py: 2.25, ...fieldSx }}>
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
    <Stack component="form" id={id} onSubmit={onSubmit} spacing={1.6}>
      {children}
    </Stack>
  );
}
