import type { AppConfig } from '@barber/tenant-config'
import { useContext } from 'react'
import { EditorContext, type EditorState } from './editor-context'

export function useEditorState() {
  const context = useContext(EditorContext)
  if (!context) throw new Error('useEditor precisa estar dentro de <EditorProvider>')
  return context
}

/** Versão para editores: garante `working` carregado. */
export function useEditor(): Omit<EditorState, 'working'> & { working: AppConfig } {
  const state = useEditorState()
  if (!state.working) throw new Error('Editor sem configuração carregada')
  return state as Omit<EditorState, 'working'> & { working: AppConfig }
}
