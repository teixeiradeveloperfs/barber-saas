import { useContext } from 'react'
import { ToastContext } from './toast-context'

export function useToast() {
  const push = useContext(ToastContext)
  if (!push) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return push
}
