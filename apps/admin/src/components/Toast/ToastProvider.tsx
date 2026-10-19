import { useCallback, useState, type ReactNode } from 'react'
import { CheckIcon, XIcon } from '../../ui/icons/Icons'
import { ToastContext, type ToastInput } from './toast-context'
import styles from './Toast.module.css'

type Toast = ToastInput & { id: number }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.random()
    setToasts((list) => [...list, { ...input, id }])
    window.setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 4200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className={styles.stack} aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={[styles.toast, styles[toast.kind ?? 'info']].join(' ')} role="status">
            <span className={styles.icon} aria-hidden="true">
              {toast.kind === 'erro' ? <XIcon /> : <CheckIcon />}
            </span>
            <span className={styles.text}>
              <span className={styles.title}>{toast.title}</span>
              {toast.detail && <span className={styles.detail}>{toast.detail}</span>}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
