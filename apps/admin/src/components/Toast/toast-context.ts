import { createContext } from 'react'

export type ToastKind = 'ok' | 'erro' | 'info'
export type ToastInput = { kind?: ToastKind; title: string; detail?: string }
export const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)
