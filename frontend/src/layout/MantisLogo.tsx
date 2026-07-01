import { Box, Typography } from '@mui/material';

export function MantisLogo() {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25, color: 'primary.main' }}>
      <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.63564 15.8644L6.94797 13.552L6.95038 13.5496H11.3006L7.35024 17.5L17.5 27.6498L27.6498 17.5L23.6994 13.5496H28.0496L32 17.5L17.5 32L3 17.5L4.63564 15.8644ZM17.5 3L25.8784 11.3784H21.5282L17.5 7.35024L13.4718 11.3784H9.12158L17.5 3Z" fill="currentColor" />
        <path d="M6.94549 13.5496L17.4999 24.1041L28.0544 13.5496H6.94549Z" fill="currentColor" opacity="0.72" />
      </svg>
      <Typography component="span" sx={{ color: 'text.primary', fontSize: 28, fontWeight: 700, letterSpacing: -0.8 }}>Mantis</Typography>
    </Box>
  );
}
