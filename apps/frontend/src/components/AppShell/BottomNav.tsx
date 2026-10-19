import { NavLink } from 'react-router-dom'
import { availableNavItems } from './nav'
import styles from './BottomNav.module.css'

export function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Principal">
      {availableNavItems()
        .filter((item) => item.mobile !== false)
        .map(({ to, label, shortLabel, featured, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [styles.item, featured && styles.featured, isActive && styles.active]
              .filter(Boolean)
              .join(' ')
          }
          aria-label={label}
        >
          <span className={styles.icon}>
            <Icon />
          </span>
          <span className={styles.label}>{shortLabel ?? label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
