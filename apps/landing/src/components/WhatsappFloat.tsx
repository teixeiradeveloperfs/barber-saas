import { useLinks } from '../settings-context'
import { track } from '../tracking'
import styles from './WhatsappFloat.module.css'

/** Botão fixo de WhatsApp no canto inferior direito, com um pulso discreto. */
export function WhatsappFloat() {
  const links = useLinks()
  return (
    <a className={styles.float} href={links.contact} target="_blank" rel="noreferrer" onClick={() => track('contact')} aria-label="Falar com o Sua Barbearia no WhatsApp">
      <span className={styles.pulse} aria-hidden="true" />
      <svg viewBox="0 0 32 32" aria-hidden="true" className={styles.icon}>
        <path
          fill="currentColor"
          d="M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.3.6 4.54 1.74 6.52L3 29l6.65-1.74A12.95 12.95 0 0 0 16.04 29C23.2 29 29 23.18 29 16S23.2 3 16.04 3Zm0 23.8c-2.02 0-4-.54-5.72-1.57l-.41-.24-3.95 1.03 1.05-3.85-.27-.4A10.78 10.78 0 0 1 5.2 16c0-5.97 4.86-10.83 10.84-10.83 5.97 0 10.8 4.86 10.8 10.83 0 5.98-4.84 10.8-10.8 10.8Zm5.93-8.1c-.33-.16-1.94-.96-2.24-1.07-.3-.11-.52-.16-.74.17-.22.32-.85 1.06-1.04 1.28-.19.22-.38.25-.71.08-.33-.16-1.38-.51-2.63-1.62-.97-.87-1.63-1.94-1.82-2.27-.19-.33-.02-.5.14-.67.15-.14.33-.38.49-.57.17-.19.22-.33.33-.55.11-.22.06-.41-.03-.57-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.57.08-.87.41-.3.33-1.14 1.11-1.14 2.72 0 1.6 1.17 3.15 1.33 3.37.16.22 2.3 3.51 5.58 4.92.78.34 1.39.54 1.86.69.78.25 1.5.21 2.06.13.63-.09 1.94-.79 2.21-1.56.27-.77.27-1.43.19-1.56-.08-.14-.3-.22-.63-.38Z"
        />
      </svg>
    </a>
  )
}
