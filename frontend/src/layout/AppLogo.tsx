import { Box, Typography } from '@mui/material';

import logoUrl from '../assets/pdf-server-logo.svg';

interface AppLogoProps {
  showText?: boolean;
}

export function AppLogo({ showText = true }: AppLogoProps) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.1, minWidth: 0 }}>
      <Box
        component="img"
        src={logoUrl}
        alt="PDF Server"
        sx={{
          width: 36,
          height: 36,
          display: 'block',
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
      {showText ? (
        <Typography
          component="span"
          noWrap
          sx={{ color: 'text.primary', fontSize: 25, fontWeight: 700, letterSpacing: -0.7, lineHeight: 1 }}
        >
          PDF Server
        </Typography>
      ) : null}
    </Box>
  );
}
