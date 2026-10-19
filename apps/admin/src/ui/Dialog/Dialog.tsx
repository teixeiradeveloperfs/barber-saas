import { useEffect, useRef, type ReactNode } from 'react'
import styles from './Dialog.module.css'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions: ReactNode
  /** `lg` para conteúdo em grade (seletor de imagens). */
  size?: 'md' | 'lg'
}

/** Modal em <dialog> nativo: foco, Esc e backdrop vêm do navegador. */
export function Dialog({ open, onClose, title, children, actions, size = 'md' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={[styles.dialog, size === 'lg' && styles.lg].filter(Boolean).join(' ')}
      onClose={onClose}
      onClick={(event) => {
        // Clique no backdrop (fora do conteúdo) fecha.
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="dialog-title"
    >
      <div className={styles.content}>
        <h2 id="dialog-title" className={styles.title}>
          {title}
        </h2>
        <div className={styles.body}>{children}</div>
        <div className={styles.actions}>{actions}</div>
      </div>
    </dialog>
  )
}
