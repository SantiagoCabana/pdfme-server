import type { ThemeMode } from '../../../theme/mantisTheme';

export function createPdfmeTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';

  // PDFme 6.1 clones options with structuredClone, so AntD algorithm functions
  // cannot be passed here. Keep this object fully serializable.
  return {
    token: {
      colorPrimary: '#1677ff',
      colorBgBase: isDark ? '#0f172a' : '#ffffff',
      colorBgContainer: isDark ? '#141c2f' : '#ffffff',
      colorBgElevated: isDark ? '#172036' : '#ffffff',
      colorText: isDark ? '#e5e7eb' : '#262626',
      colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
      colorBorder: isDark ? '#26344f' : '#e2e8f0',
      colorBorderSecondary: isDark ? '#334155' : '#f0f0f0',
      borderRadius: 6,
      fontFamily: 'Public Sans, sans-serif',
    },
  };
}
