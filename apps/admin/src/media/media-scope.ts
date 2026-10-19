import { createContext, useContext } from 'react'

/** Barbearia cujo banco de imagens os campos de imagem oferecem. Nulo: só URL digitada. */
export const MediaScopeContext = createContext<string | null>(null)

export function useMediaScope() {
  return useContext(MediaScopeContext)
}
