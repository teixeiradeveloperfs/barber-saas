import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { adminApi, publicUrl, type TenantDetail } from '../../api/admin'
import { isManagerRole, useTenantRole } from '../../auth/useTenantRole'
import { ErrorState, Loading } from '../../components/Loading/Loading'
import { useToast } from '../../components/Toast/useToast'
import { EditorProvider } from '../../editor/EditorProvider'
import { useEditor } from '../../editor/useEditor'
import { useResource } from '../../lib/useResource'
import { MediaScopeContext } from '../../media/media-scope'
import { Button } from '../../ui/Button/Button'
import { CheckIcon } from '../../ui/icons/Icons'
import { BrandEditor } from '../Tenant/editors/BrandEditor'
import { ServicesEditor } from '../Tenant/editors/ServicesEditor'
import { StepData } from './StepData'
import { StepHours } from './StepHours'
import { StepTeam } from './StepTeam'
import styles from './OnboardingPage.module.css'

/** Os 6 passos, na ordem. O 1 (senha) acontece no primeiro acesso. */
const STEPS = [
  { title: 'Senha', lead: '' },
  { title: 'Dados', lead: 'Nome, WhatsApp e endereço da barbearia.' },
  { title: 'Marca', lead: 'Logo, cores e fotos. Dá para deixar o padrão e ajustar depois.' },
  { title: 'Serviços', lead: 'Já vem uma lista de exemplo: ajuste preços e durações, apague o que não faz.' },
  { title: 'Equipe', lead: 'Quem atende. Cada barbeiro ganha agenda própria.' },
  { title: 'Horários', lead: 'Quando a barbearia abre. Depois é só publicar.' },
] as const

/** Passo a passo do dono logo depois da compra: passos 2 a 6, publicando no fim. */
export function OnboardingPage() {
  const { installationId = '' } = useParams()
  const role = useTenantRole(installationId)
  const tenant = useResource(() => adminApi.getTenant(installationId), [installationId])
  if (!isManagerRole(role)) return <Navigate to="/" replace />
  if (tenant.error && !tenant.data) return <ErrorState message={tenant.error} onRetry={tenant.reload} />
  if (!tenant.data) return <Loading label="Preparando sua barbearia…" />
  return (
    <MediaScopeContext.Provider value={tenant.data.id}>
      <EditorProvider tenant={tenant.data} mutate={tenant.mutate}>
        <Wizard tenant={tenant.data} />
      </EditorProvider>
    </MediaScopeContext.Provider>
  )
}

function Wizard({ tenant }: { tenant: TenantDetail }) {
  const { step: raw = '2' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { dirty, save, saving, saveAndPublish, publishing } = useEditor()
  const [done, setDone] = useState(false)
  const step = Math.min(6, Math.max(2, Number(raw) || 2))
  const stepper = useRef<HTMLOListElement>(null)
  // No celular a barra de passos rola: mantém o passo atual à vista.
  useEffect(() => {
    stepper.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [step])
  const go = (next: number) => {
    navigate(`/comecar/${tenant.id}/${next}`)
    window.scrollTo({ top: 0 })
  }

  async function next() {
    if (dirty && !(await save())) {
      toast({ kind: 'erro', title: 'Confira os campos marcados', detail: 'Corrija e tente de novo.' })
      return
    }
    go(step + 1)
  }

  async function finish() {
    await saveAndPublish()
    setDone(true)
  }

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.done}>
          <span className={styles.doneIcon}>
            <CheckIcon />
          </span>
          <h1 className={styles.title}>O app da {tenant.name} está no ar.</h1>
          <p className={styles.lead}>Mande o link para os clientes e instale na tela inicial do seu celular. Tudo o que você montou dá para mudar depois em Minhas barbearias.</p>
          <div className={styles.actions}>
            <Button onClick={() => window.open(publicUrl(tenant), '_blank', 'noopener')}>Abrir o app</Button>
            <Button variant="ghost" to={`/inicio/${tenant.id}`}>
              Ir para o Início
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <ol ref={stepper} className={styles.stepper} aria-label="Passos">
        {STEPS.map((item, index) => {
          const number = index + 1
          const state = number < step ? 'feito' : number === step ? 'atual' : 'depois'
          return (
            <li key={item.title} className={styles[state]} aria-current={state === 'atual' ? 'step' : undefined}>
              <button type="button" disabled={number === 1} onClick={() => number > 1 && go(number)}>
                <span className={styles.num}>{state === 'feito' ? <CheckIcon /> : number}</span>
                <span className={styles.label}>{item.title}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <header className={styles.head}>
        <p className={styles.eyebrow}>
          Passo {step} de {STEPS.length}
        </p>
        <h1 className={styles.title}>{STEPS[step - 1].title}</h1>
        <p className={styles.lead}>{STEPS[step - 1].lead}</p>
      </header>

      <div className={styles.body}>
        {step === 2 && <StepData />}
        {step === 3 && <BrandEditor />}
        {step === 4 && <ServicesEditor />}
        {step === 5 && <StepTeam installationId={tenant.id} />}
        {step === 6 && <StepHours />}
      </div>

      <footer className={styles.footer}>
        <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 2 || saving}>
          Voltar
        </Button>
        <span className={styles.spacer} />
        {step < 6 ? (
          <>
            {step !== 2 && (
              <Button variant="ghost" onClick={() => go(step + 1)} disabled={saving || dirty}>
                Pular
              </Button>
            )}
            <Button onClick={next} loading={saving}>
              {dirty ? 'Salvar e continuar' : 'Continuar'}
            </Button>
          </>
        ) : (
          <Button onClick={finish} loading={publishing || saving}>
            Publicar e abrir o app
          </Button>
        )}
      </footer>
    </div>
  )
}
