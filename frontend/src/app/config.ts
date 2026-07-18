const fallbackAppName = 'PDF Server';

export const appName = String(import.meta.env.VITE_APP_NAME || fallbackAppName).trim() || fallbackAppName;
