import { useState, type ReactNode } from 'react'
import { ScissorsIcon } from '../ScissorsIcon/ScissorsIcon'
import styles from './Photo.module.css'

type PhotoProps = {
  src?: string
  alt?: string
  className?: string
  children?: ReactNode
}

/**
 * Imagem com fallback. Se `src` faltar ou falhar, mostra um bloco charcoal com
 * a tesoura da marca em marca d'água, então o card continua inteiro.
 * `children` são sobrepostos à foto (chips, botões).
 */
export function Photo({ src, alt = '', className, children }: PhotoProps) {
  const [broken, setBroken] = useState(false)
  const showImage = Boolean(src) && !broken

  return (
    <div className={[styles.photo, className].filter(Boolean).join(' ')}>
      {showImage ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setBroken(true)} />
      ) : (
        <span className={styles.fallback} aria-hidden="true">
          <ScissorsIcon className={styles.mark} />
        </span>
      )}
      {children}
    </div>
  )
}
