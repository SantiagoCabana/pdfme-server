import type { ThemeMode } from '../../../theme/mantisTheme';

export function createPdfmeTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';

  // PDFme 6.1 clones options with structuredClone, so AntD algorithm functions
  // cannot be passed here. Keep this object fully serializable.
  return {
    token: {
      colorPrimary: '#1677ff',
      colorBgBase: isDark ? '#181818' : '#ffffff',
      colorBgContainer: isDark ? '#222222' : '#ffffff',
      colorBgElevated: isDark ? '#282828' : '#ffffff',
      colorText: isDark ? '#f5f5f5' : '#262626',
      colorTextSecondary: isDark ? '#a3a3a3' : '#64748b',
      colorBorder: isDark ? '#363636' : '#e2e8f0',
      colorBorderSecondary: isDark ? '#444444' : '#f0f0f0',
      borderRadius: 6,
      fontFamily: 'Public Sans, sans-serif',
    },
  };
}
