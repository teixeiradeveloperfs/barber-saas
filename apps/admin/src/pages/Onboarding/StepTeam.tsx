import { useState } from 'react'
import { adminApi, assetUrl, type TeamBarber } from '../../api/admin'
import { Card } from '../../components/Card/Card'
import { ErrorState, Loading } from '../../components/Loading/Loading'
import { useResource } from '../../lib/useResource'
import { Button } from '../../ui/Button/Button'
import { PlusSquareIcon } from '../../ui/icons/Icons'
import { BarberDialog } from '../Team/BarberDialog'
import styles from './OnboardingPage.module.css'

/** Passo 5: quem atende. Cada barbeiro tem agenda própria no app. */
export function StepTeam({ installationId }: { installationId: string }) {
  const team = useResource(() => adminApi.listTeam(installationId), [installationId])
  const [editing, setEditing] = useState<{ key: number; barber: TeamBarber | null } | null>(null)

  if (team.error && !team.data) return <ErrorState message={team.error} onRetry={team.reload} />
  if (!team.data) return <Loading label="Carregando equipe…" />

  return (
    <Card
      title="Sua equipe"
      description="Cada barbeiro ganha agenda própria no app. Você pode mudar isso depois em Equipe."
      actions={
        <Button size="sm" onClick={() => setEditing({ key: Date.now(), barber: null })}>
          <PlusSquareIcon />
          Adicionar barbeiro
        </Button>
      }
    >
      {team.data.length === 0 ? (
        <p className={styles.muted}>Ninguém na equipe ainda. Adicione pelo menos um barbeiro (pode ser você) para o app receber agendamentos.</p>
      ) : (
        <ul className={styles.team}>
          {team.data.map((barber) => (
            <li key={barber.slug}>
              {barber.image ? <img src={assetUrl(barber.image)} alt="" /> : <span className={styles.initial}>{barber.name.slice(0, 1)}</span>}
              <span className={styles.teamName}>{barber.name}</span>
              <button type="button" className={styles.textButton} onClick={() => setEditing({ key: Date.now(), barber })}>
                Editar
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <BarberDialog
          key={editing.key}
          installationId={installationId}
          barber={editing.barber}
          taken={team.data.map((item) => item.slug)}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            team.mutate((list) => (list.some((item) => item.slug === saved.slug) ? list.map((item) => (item.slug === saved.slug ? saved : item)) : [...list, saved]))
            setEditing(null)
          }}
        />
      )}
    </Card>
  )
}
