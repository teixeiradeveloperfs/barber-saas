import { useState } from 'react'
import { useAppointments } from '../../appointments/useAppointments'
import { Button } from '../../components/Button/Button'
import { Segmented } from '../../components/Segmented/Segmented'
import { CalendarIcon, ChatIcon } from '../../components/icons/Icons'
import { whatsappLink } from '../../data/shop'
import { useFlash } from '../Profile/useFlash'
import { AppointmentCard } from './AppointmentCard'
import styles from './appointments.module.css'

type Tab = 'proximos' | 'anteriores'

export function Appointments() {
  const { upcoming, past } = useAppointments()
  const [tab, setTab] = useState<Tab>('proximos')
  const { message, flash } = useFlash()

  const list = tab === 'proximos' ? upcoming : past

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Agendamentos</h1>
          <p className={styles.subtitle}>Seus próximos cortes e o histórico com a equipe.</p>
        </div>
        <Segmented
          aria-label="Período"
          options={[
            { value: 'proximos', label: `Próximos (${upcoming.length})` },
            { value: 'anteriores', label: `Anteriores (${past.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </header>

      <div className={styles.layout}>
        <div className={styles.list} aria-live="polite">
          {message && (
            <p className={styles.flash} role="status">
              {message}
            </p>
          )}

          {list.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden="true">
                <CalendarIcon />
              </span>
              {tab === 'proximos' ? (
                <>
                  <h2 className={styles.emptyTitle}>Nenhum corte marcado.</h2>
                  <p className={styles.emptyText}>Escolha um barbeiro e garanta seu horário.</p>
                  <Button size="lg" to="/barbeiros">
                    Escolher barbeiro
                  </Button>
                </>
              ) : (
                <>
                  <h2 className={styles.emptyTitle}>Ainda sem histórico.</h2>
                  <p className={styles.emptyText}>Seus atendimentos concluídos vão aparecer aqui.</p>
                </>
              )}
            </div>
          ) : (
            list.map((appointment, index) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                upcoming={tab === 'proximos'}
                featured={tab === 'proximos' && index === 0}
                onFlash={flash}
              />
            ))
          )}
        </div>

        <aside className={styles.aside}>
          <section className={styles.infoCard}>
            <h2 className={styles.infoTitle}>Política de cancelamento</h2>
            <p className={styles.infoText}>
              Cancelamento e reagendamento grátis até 2 horas antes do horário. Depois disso a
              barbearia pode cobrar taxa. Faltas sem aviso podem limitar novos agendamentos.
            </p>
          </section>
          <section className={styles.infoCard}>
            <h2 className={styles.infoTitle}>Precisa de ajuda?</h2>
            <p className={styles.infoText}>Fale direto com a recepção pelo WhatsApp.</p>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={styles.whatsapp}>
              <ChatIcon />
              Abrir WhatsApp
            </a>
          </section>
        </aside>
      </div>
    </div>
  )
}
