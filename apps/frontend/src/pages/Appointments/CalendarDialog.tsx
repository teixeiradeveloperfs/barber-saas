import { Button } from '../../components/Button/Button'
import { Dialog } from '../../components/Dialog/Dialog'
import { CalendarIcon, DownloadIcon } from '../../components/icons/Icons'
import { downloadIcs, googleCalendarUrl } from '../../appointments/calendar'
import styles from './appointments.module.css'

type CalendarDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description: string
  start: Date
  durationMin: number
}

export function CalendarDialog({ open, onClose, ...event }: CalendarDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Adicionar ao calendário"
      actions={
        <Button variant="ghost" size="lg" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className={styles.calendarOptions}>
        <a
          href={googleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.calendarOption}
        >
          <CalendarIcon />
          <span>
            <span className={styles.optionTitle}>Google Calendar</span>
            <span className={styles.optionHint}>Abre o evento pronto para salvar.</span>
          </span>
        </a>
        <button type="button" className={styles.calendarOption} onClick={() => downloadIcs(event)}>
          <DownloadIcon />
          <span>
            <span className={styles.optionTitle}>Apple, Outlook e outros</span>
            <span className={styles.optionHint}>Baixa um arquivo .ics com lembrete 2h antes.</span>
          </span>
        </button>
      </div>
    </Dialog>
  )
}
