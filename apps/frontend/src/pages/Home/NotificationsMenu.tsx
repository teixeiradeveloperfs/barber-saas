import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Popover } from '../../components/Popover/Popover'
import { BellIcon, CalendarIcon, CrownIcon, SparklesIcon, TrophyIcon, XIcon } from '../../components/icons/Icons'
import { relativeTime } from '../../notifications/derive'
import type { NotificationKind } from '../../notifications/notifications-context'
import { useNotifications } from '../../notifications/useNotifications'
import styles from './HeaderMenus.module.css'

const ICONS: Record<NotificationKind, typeof BellIcon> = {
  agenda: CalendarIcon,
  pontos: TrophyIcon,
  clube: CrownIcon,
  novidade: SparklesIcon,
}

export function NotificationsMenu({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { notifications, unreadCount, isRead, markRead, markAllRead, dismiss } = useNotifications()
  const [open, setOpen] = useState(false)

  function openItem(id: string, to: string) {
    markRead(id)
    setOpen(false)
    navigate(to)
  }

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      title="Notificações"
      width={380}
      trigger={(aria) => (
        <button
          type="button"
          className={[styles.iconButton, className].filter(Boolean).join(' ')}
          onClick={() => setOpen((state) => !state)}
          aria-label={unreadCount ? `Notificações, ${unreadCount} não lidas` : 'Notificações'}
          {...aria}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className={styles.badge} aria-hidden="true">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    >
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>Notificações</h2>
        {unreadCount > 0 && (
          <button type="button" className={styles.panelAction} onClick={markAllRead}>
            Marcar todas como lidas
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <p className={styles.empty}>Nada por aqui. Quando houver novidade, avisamos.</p>
      ) : (
        <ul className={styles.list}>
          {notifications.map((item) => {
            const Icon = ICONS[item.kind]
            const read = isRead(item.id)
            return (
              <li key={item.id} className={[styles.item, !read && styles.unread].filter(Boolean).join(' ')}>
                <button type="button" className={styles.itemMain} onClick={() => openItem(item.id, item.to)}>
                  <span className={styles.itemIcon} aria-hidden="true">
                    <Icon />
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <span className={styles.itemBody}>{item.body}</span>
                    <span className={styles.itemTime}>{relativeTime(item.date)}</span>
                  </span>
                  {!read && <span className={styles.dot} aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  className={styles.itemDismiss}
                  onClick={() => dismiss(item.id)}
                  aria-label="Dispensar notificação"
                >
                  <XIcon />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Popover>
  )
}
