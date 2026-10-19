import { useContext } from 'react'
import { GamificationContext } from './gamification-context'

export function useGamification() {
  const context = useContext(GamificationContext)
  if (!context) throw new Error('useGamification precisa estar dentro de <GamificationProvider>')
  return context
}
