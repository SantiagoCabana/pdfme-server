import { createTheme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

export function createMantisTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: '#1677ff', light: '#69c0ff', dark: '#0958d9', contrastText: '#ffffff' },
      secondary: { main: '#8c8c8c' },
      background: {
        default: isDark ? '#111936' : '#f0f2f8',
        paper: isDark ? '#1e2746' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f5f5f5' : '#262626',
        secondary: isDark ? '#bfbfbf' : '#8c8c8c',
      },
      divider: isDark ? '#303b5f' : '#f0f0f0',
    },
    typography: {
      fontFamily: 'Public Sans, sans-serif',
      h1: { fontWeight: 600, fontSize: '2.375rem', lineHeight: 1.21 },
      h2: { fontWeight: 600, fontSize: '1.875rem', lineHeight: 1.27 },
      h3: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.33 },
      h4: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.4 },
      h5: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
      h6: { fontWeight: 400, fontSize: '0.875rem', lineHeight: 1.57 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: { styleOverrides: { root: { boxShadow: 'none' } } },
      MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 700, fontSize: 12, textTransform: 'uppercase' } } },
    },
  });
}
