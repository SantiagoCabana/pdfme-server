import type { ThemeMode } from '../../../theme/appTheme';

export function createPdfmeTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';

  // PDFme 6.1 clones options with structuredClone, so AntD algorithm functions
  // cannot be passed here. Keep this object fully serializable.
  return {
    token: {
      colorPrimary: '#1677ff',
      colorBgBase: isDark ? '#141414' : '#ffffff',
      colorBgContainer: isDark ? '#1b1b1b' : '#ffffff',
      colorBgElevated: isDark ? '#222222' : '#ffffff',
      colorText: isDark ? '#f5f5f5' : '#262626',
      colorTextSecondary: isDark ? '#a3a3a3' : '#64748b',
      colorBorder: isDark ? '#303030' : '#e2e8f0',
      colorBorderSecondary: isDark ? '#3a3a3a' : '#f0f0f0',
      borderRadius: 6,
      fontFamily: 'Public Sans, sans-serif',
    },
  };
}
