import type { ReactNode } from 'react'
import styles from './Card.module.css'

type CardProps = {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  /** Sem padding interno, para tabelas e listas que encostam na borda. */
  flush?: boolean
  /** Ações abaixo do título, para colunas estreitas. */
  stackHeader?: boolean
}

export function Card({ title, description, actions, children, className, flush, stackHeader }: CardProps) {
  return (
    <section className={[styles.card, flush && styles.flush, stackHeader && styles.stacked, className].filter(Boolean).join(' ')}>
      {(title || actions) && (
        <header className={styles.header}>
          <div className={styles.heading}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
