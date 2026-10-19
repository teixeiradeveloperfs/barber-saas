import { useContext } from 'react'
import { UserContext } from './user-context'

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser precisa estar dentro de <UserProvider>')
  return context
}
