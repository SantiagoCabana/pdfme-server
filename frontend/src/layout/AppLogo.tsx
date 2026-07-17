import { Box, Typography } from '@mui/material';

interface AppLogoProps {
  showText?: boolean;
}

export function AppLogo({ showText = true }: AppLogoProps) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.1, minWidth: 0 }}>
      <Box
        aria-label="PDF Server"
        component="svg"
        role="img"
        viewBox="0 0 24 24"
        sx={{
          width: 36,
          height: 36,
          display: 'block',
          flexShrink: 0,
          color: (theme) => theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[800],
        }}
      >
        <title>PDF Server</title>
        <path fill="currentColor" d="M3.24,7.29l8.52,4.63a.51.51,0,0,0,.48,0l8.52-4.63a.44.44,0,0,0-.05-.81L12.19,3a.5.5,0,0,0-.38,0L3.29,6.48A.44.44,0,0,0,3.24,7.29Z" />
        <path fill="currentColor" d="M20.71,10.66l-1.83-.78-6.64,3.61a.51.51,0,0,1-.48,0L5.12,9.88l-1.83.78a.48.48,0,0,0,0,.85l8.52,4.9a.46.46,0,0,0,.48,0l8.52-4.9A.48.48,0,0,0,20.71,10.66Z" opacity="0.82" />
        <path fill="currentColor" d="M20.71,15.1l-1.56-.68-6.91,3.76a.51.51,0,0,1-.48,0L4.85,14.42l-1.56.68a.49.49,0,0,0,0,.87l8.52,5a.51.51,0,0,0,.48,0l8.52-5A.49.49,0,0,0,20.71,15.1Z" opacity="0.64" />
      </Box>
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
