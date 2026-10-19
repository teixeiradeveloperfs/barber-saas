import type { AppConfig } from '@barber/tenant-config'
import { createContext } from 'react'

export type EditorState = {
  /** Config em edição: rascunho local, senão o rascunho salvo, senão o publicado. */
  working: AppConfig | null
  /** Há alterações locais ainda não salvas como rascunho. */
  dirty: boolean
  saving: boolean
  /** Conta salvamentos bem-sucedidos; o preview recarrega quando muda. */
  savedCount: number
  /** Erros por caminho (`barbers.0.rating`), do zod local ou da API. */
  issues: Record<string, string>
  issue: (path: string) => string | undefined
  patch: (updater: (config: AppConfig) => AppConfig) => void
  reset: () => void
  save: () => Promise<boolean>
  /** Salva o rascunho (se houver alterações) e publica em seguida. */
  saveAndPublish: () => Promise<boolean>
  /** Existe rascunho salvo que ainda não foi publicado. */
  hasDraft: boolean
  draftVersion: number | null
  publishing: boolean
}

export const EditorContext = createContext<EditorState | null>(null)
