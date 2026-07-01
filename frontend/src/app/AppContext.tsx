import { createContext, useContext, type ReactNode } from 'react';
import type { SessionUser } from './types';
import type { ThemeMode } from '../theme/mantisTheme';

type HeaderAction = {
  label: string;
  title?: string;
  content: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
} | null;

type AppContextValue = {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  reloadDataToken: number;
  bumpReloadDataToken: () => void;
  mode: ThemeMode;
  toggleMode: () => void;
  headerAction: HeaderAction;
  setHeaderAction: (action: HeaderAction) => void;
  headerActionOpen: boolean;
  openHeaderAction: () => void;
  closeHeaderAction: () => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useAppContext debe usarse dentro de AppContext.Provider');
  return value;
}
