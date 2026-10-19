import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './Popover.module.css'

type PopoverProps = {
  open: boolean
  onClose: () => void
  /** Botão que abre o painel. Recebe os atributos ARIA. */
  trigger: (props: { 'aria-expanded': boolean; 'aria-controls': string; 'aria-haspopup': 'dialog' }) => ReactNode
  title: string
  children: ReactNode
  /** Largura do painel no desktop. */
  width?: number
  className?: string
}

/**
 * Painel ancorado no botão. No celular vira uma folha colada no topo.
 * Fecha com Esc, clique fora ou navegação.
 */
export function Popover({ open, onClose, trigger, title, children, width = 360, className }: PopoverProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, onClose])

  return (
    <div ref={rootRef} className={[styles.root, className].filter(Boolean).join(' ')}>
      {trigger({ 'aria-expanded': open, 'aria-controls': id, 'aria-haspopup': 'dialog' })}
      {open && (
        <div id={id} role="dialog" aria-label={title} className={styles.panel} style={{ '--panel-w': `${width}px` } as React.CSSProperties}>
          {children}
        </div>
      )}
    </div>
  )
}
