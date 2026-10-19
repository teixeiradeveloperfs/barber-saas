import type { ReactNode } from 'react'
import styles from './fields.module.css'

/** Grade de campos: 1 coluna no celular, `cols` no desktop. */
export function Grid({ cols = 2, children }: { cols?: 2 | 3 | 4; children: ReactNode }) {
  return <div className={[styles.grid, styles[`cols${cols}`]].join(' ')}>{children}</div>
}

export function Stack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>
}

export function Subheading({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className={styles.subheading}>
      <h3>{children}</h3>
      {hint && <p>{hint}</p>}
    </div>
  )
}
