import { ScissorsIcon } from '../../components/ScissorsIcon/ScissorsIcon'
import styles from './SectionPlaceholder.module.css'

type SectionPlaceholderProps = {
  title: string
  description: string
  eyebrow?: string
}

/** Tela de seção ainda não construída. Mantém a navegação funcionando. */
export function SectionPlaceholder({
  title,
  description,
  eyebrow = 'Em breve',
}: SectionPlaceholderProps) {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <ScissorsIcon className={styles.mark} />
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
    </section>
  )
}
