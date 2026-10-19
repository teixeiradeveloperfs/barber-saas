import type { ReactNode } from 'react'
import styles from './Screen.module.css'

type ScreenProps = {
  children: ReactNode
}

/** Wrapper de página: ocupa a viewport inteira em qualquer tamanho de tela. */
export function Screen({ children }: ScreenProps) {
  return <main className={styles.screen}>{children}</main>
}
