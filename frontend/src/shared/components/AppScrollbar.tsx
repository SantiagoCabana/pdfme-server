import type { ReactNode } from 'react';
import SimpleBar from 'simplebar-react';
import { Box, type SxProps, type Theme } from '@mui/material';

interface AppScrollbarProps {
  children: ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
}

export function AppScrollbar({ children, className, sx }: AppScrollbarProps) {
  return (
    <Box className={className} sx={{ minHeight: 0, minWidth: 0, ...sx }}>
      <SimpleBar autoHide={false} className="app-scrollbar" style={{ height: '100%', maxHeight: '100%' }}>
        {children}
      </SimpleBar>
    </Box>
  );
}
