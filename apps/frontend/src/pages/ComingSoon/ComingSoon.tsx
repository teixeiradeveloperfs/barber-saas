import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo/Logo'
import styles from './ComingSoon.module.css'

export function ComingSoon() {
  return (
    <section className={styles.page}>
      <header>
        <Logo />
      </header>
      <div className={styles.body}>
        <p className={styles.eyebrow}>Próxima tela</p>
        <h1 className={styles.title}>A tela de entrar está a caminho.</h1>
        <Link to="/" className={styles.back}>
          Voltar ao início
        </Link>
      </div>
    </section>
  )
}
