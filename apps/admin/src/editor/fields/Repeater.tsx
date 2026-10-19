import type { ReactNode } from 'react'
import { Button } from '../../ui/Button/Button'
import { PlusSquareIcon, TrashIcon } from '../../ui/icons/Icons'
import styles from './fields.module.css'

type RepeaterProps<T> = {
  items: T[]
  onChange: (items: T[]) => void
  /** Título mostrado no cabeçalho de cada item. */
  title: (item: T, index: number) => string
  /** Cria um item novo em branco. */
  create?: () => T
  addLabel?: string
  empty?: string
  /** Máximo de itens; sem "Adicionar" ao atingir. */
  max?: number
  children: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode
}

/** Lista editável genérica: adicionar, remover, mover. */
export function Repeater<T>({ items, onChange, title, create, addLabel = 'Adicionar', empty, max, children }: RepeaterProps<T>) {
  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  return (
    <div className={styles.repeater}>
      {items.length === 0 && empty && <p className={styles.repeaterEmpty}>{empty}</p>}
      {items.map((item, index) => (
        <div key={index} className={styles.repeaterItem}>
          <div className={styles.repeaterHead}>
            <span className={styles.repeaterTitle}>
              <span className={styles.repeaterIndex}>{index + 1}</span>
              {title(item, index) || 'Sem nome'}
            </span>
            <div className={styles.repeaterActions}>
              <button type="button" className={styles.iconButton} onClick={() => move(index, -1)} disabled={index === 0} aria-label="Mover para cima">
                ↑
              </button>
              <button type="button" className={styles.iconButton} onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Mover para baixo">
                ↓
              </button>
              <button type="button" className={[styles.iconButton, styles.iconDanger].join(' ')} onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label={`Remover ${title(item, index) || 'item'}`}>
                <TrashIcon />
              </button>
            </div>
          </div>
          <div className={styles.repeaterBody}>
            {children(item, index, (patch) => onChange(items.map((current, i) => (i === index ? { ...current, ...patch } : current))))}
          </div>
        </div>
      ))}
      {create && (max === undefined || items.length < max) && (
        <Button variant="ghost" size="sm" onClick={() => onChange([...items, create()])}>
          <PlusSquareIcon />
          {addLabel}
        </Button>
      )}
    </div>
  )
}
