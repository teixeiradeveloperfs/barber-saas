import { MoonIcon, SunIcon } from '../icons/Icons'
import { useTheme } from '../../theme/useTheme'
import styles from './ThemeToggle.module.css'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme()
  const isDark = resolved === 'dark'

  return (
    <button
      type="button"
      className={[styles.toggle, className].filter(Boolean).join(' ')}
      onClick={toggle}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
    >
      <span className={styles.icon} data-active={isDark || undefined}>
        <SunIcon />
      </span>
      <span className={styles.icon} data-active={!isDark || undefined}>
        <MoonIcon />
      </span>
    </button>
  )
}
