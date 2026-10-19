import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export type ThemeContextValue = {
  /** Escolha do usuário. `system` segue o sistema operacional. */
  theme: Theme
  /** Tema efetivamente aplicado. */
  resolved: ResolvedTheme
  setTheme: (theme: Theme) => void
  /** Alterna entre claro e escuro a partir do tema aplicado. */
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
