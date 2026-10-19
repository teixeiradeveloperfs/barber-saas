import styles from './Pole.module.css'

type Props = {
  direction?: 'vertical' | 'horizontal'
  className?: string
}

/**
 * O poste de barbeiro do símbolo, em movimento. Listras em champagne, bone e
 * ink; a posição do fundo anda um período inteiro, então o loop não tem emenda.
 */
export function Pole({ direction = 'vertical', className }: Props) {
  return <span aria-hidden="true" className={[styles.pole, direction === 'horizontal' ? styles.horizontal : styles.vertical, className].filter(Boolean).join(' ')} />
}
