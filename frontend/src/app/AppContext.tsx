import { createContext, useContext } from 'react';
import type { SessionUser } from './types';
import type { ThemeMode } from '../theme/mantisTheme';

type AppContextValue = {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  reloadDataToken: number;
  bumpReloadDataToken: () => void;
  mode: ThemeMode;
  toggleMode: () => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useAppContext debe usarse dentro de AppContext.Provider');
  return value;
}
