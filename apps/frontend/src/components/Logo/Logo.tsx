import { useState, type CSSProperties } from 'react'
import { useTenant } from '../../tenant/useTenant'
import { useTheme } from '../../theme/useTheme'
import { ScissorsIcon } from '../ScissorsIcon/ScissorsIcon'
import styles from './Logo.module.css'

type Placement = 'barra' | 'destaque'
type Shape = 'horizontal' | 'emblema'

const SCALE = { pequeno: 0.8, medio: 1, grande: 1.3 } as const

type LogoProps = {
  /** `barra`: topo e menus. `destaque`: telas de entrada e boas-vindas, onde o logo aparece grande. */
  placement?: Placement
}

/**
 * Marca do tenant: wordmark com a tesoura no meio, ou imagem enviada no admin
 * (com variante opcional para o tema claro). Imagem quase quadrada (emblema)
 * sai maior que logo horizontal, porque na mesma altura ficaria ilegível.
 */
export function Logo({ placement = 'barra' }: LogoProps) {
  const { name, brand } = useTenant()
  const { resolved } = useTheme()
  const [shape, setShape] = useState<Shape>('horizontal')

  if (brand.logo.kind === 'image') {
    const src = resolved === 'light' && brand.logo.urlLight ? brand.logo.urlLight : brand.logo.url
    const scale = SCALE[brand.logo.size ?? 'medio']
    return (
      <img
        className={[styles.image, styles[placement], shape === 'emblema' && styles.emblem].filter(Boolean).join(' ')}
        style={{ '--logo-scale': scale } as CSSProperties}
        src={src}
        alt={brand.logo.alt ?? name}
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget
          if (naturalWidth && naturalHeight) setShape(naturalWidth / naturalHeight < 2 ? 'emblema' : 'horizontal')
        }}
      />
    )
  }

  return (
    <div className={[styles.logo, placement === 'destaque' && styles.logoDestaque].filter(Boolean).join(' ')} aria-label={name}>
      <span>{brand.logo.first}</span>
      <ScissorsIcon className={styles.mark} />
      <span>{brand.logo.second}</span>
    </div>
  )
}
