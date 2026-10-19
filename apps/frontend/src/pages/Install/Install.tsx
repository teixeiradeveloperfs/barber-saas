import { useState } from 'react'
import { Button } from '../../components/Button/Button'
import { Segmented } from '../../components/Segmented/Segmented'
import {
  CheckIcon,
  DownloadIcon,
  MonitorIcon,
  MoreVerticalIcon,
  PlusSquareIcon,
  ShareIcon,
  SmartphoneIcon,
} from '../../components/icons/Icons'
import { useInstall, type Platform } from '../../pwa/useInstall'
import styles from './install.module.css'

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'ios', label: 'iPhone' },
  { value: 'android', label: 'Android' },
  { value: 'desktop', label: 'Computador' },
]

const STEPS: Record<Platform, { icon: typeof ShareIcon; text: string }[]> = {
  ios: [
    { icon: ShareIcon, text: 'No Safari, toque em Compartilhar, o quadrado com a seta para cima na barra de baixo.' },
    { icon: PlusSquareIcon, text: 'Role a lista e toque em "Adicionar à Tela de Início".' },
    { icon: CheckIcon, text: 'Confirme em "Adicionar". O ícone da Luxe Cuts aparece junto dos seus apps.' },
  ],
  android: [
    { icon: MoreVerticalIcon, text: 'No Chrome, toque nos três pontos no canto superior direito.' },
    { icon: DownloadIcon, text: 'Toque em "Instalar app" ou "Adicionar à tela inicial".' },
    { icon: CheckIcon, text: 'Confirme. O app abre em tela cheia, sem a barra do navegador.' },
  ],
  desktop: [
    { icon: DownloadIcon, text: 'No Chrome ou Edge, clique no ícone de instalar no fim da barra de endereço.' },
    { icon: CheckIcon, text: 'Confirme em "Instalar". A Luxe Cuts vira uma janela própria, com atalho no sistema.' },
  ],
}

const NOTES: Record<Platform, string> = {
  ios: 'No iPhone a instalação só funciona pelo Safari. Se abriu por outro app, toque em "Abrir no Safari" antes.',
  android: 'Se o botão "Instalar" aparecer aqui em cima, é só tocar nele. Os passos ao lado são o caminho manual.',
  desktop: 'Se não aparecer o ícone, abra o menu ⋮ e procure "Instalar Luxe Cuts". Safari no Mac: Arquivo → Adicionar ao Dock.',
}

const BENEFITS = [
  'Abre em tela cheia, sem barra do navegador',
  'Ícone na tela inicial, como qualquer app',
  'Carrega mais rápido e aguenta internet fraca',
  'Não ocupa espaço nem precisa de loja',
]

export function Install() {
  const { platform, installed, canPrompt, install } = useInstall()
  const [selected, setSelected] = useState<Platform>(platform)
  const [busy, setBusy] = useState(false)

  async function handleInstall() {
    setBusy(true)
    await install()
    setBusy(false)
  }

  if (installed) {
    return (
      <div className={styles.page}>
        <div className={styles.done} role="status">
          <span className={styles.doneIcon}>
            <CheckIcon />
          </span>
          <h1 className={styles.title}>Você já está no app.</h1>
          <p className={styles.subtitle}>
            A Luxe Cuts está instalada neste aparelho. Nada mais a fazer por aqui.
          </p>
          <Button size="lg" to="/home">
            Ir para o início
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Instale a Luxe Cuts</h1>
        <p className={styles.subtitle}>
          Leva menos de um minuto e não passa por loja de aplicativos. Depois é só tocar no ícone.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          {canPrompt && (
            <section className={`${styles.card} ${styles.promptCard}`}>
              <div>
                <h2 className={styles.cardTitle}>Instalar agora</h2>
                <p className={styles.cardHint}>Seu navegador permite instalar com um toque.</p>
              </div>
              <Button size="lg" onClick={handleInstall} loading={busy}>
                <DownloadIcon />
                Instalar
              </Button>
            </section>
          )}

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Passo a passo</h2>
              <Segmented
                aria-label="Plataforma"
                options={PLATFORMS}
                value={selected}
                onChange={setSelected}
              />
            </div>

            <ol className={styles.steps}>
              {STEPS[selected].map((step, index) => {
                const Icon = step.icon
                return (
                  <li key={step.text} className={styles.step}>
                    <span className={styles.stepNumber}>{index + 1}</span>
                    <span className={styles.stepIcon} aria-hidden="true">
                      <Icon />
                    </span>
                    <span className={styles.stepText}>{step.text}</span>
                  </li>
                )
              })}
            </ol>

            <p className={styles.note}>{NOTES[selected]}</p>
          </section>
        </div>

        <aside className={styles.aside}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Por que instalar</h2>
            <ul className={styles.benefits}>
              {BENEFITS.map((benefit) => (
                <li key={benefit}>
                  <CheckIcon />
                  {benefit}
                </li>
              ))}
            </ul>
          </section>

          <section className={`${styles.card} ${styles.devices}`}>
            <span className={styles.device}>
              <SmartphoneIcon />
              iPhone e Android
            </span>
            <span className={styles.device}>
              <MonitorIcon />
              Windows, Mac e Linux
            </span>
          </section>
        </aside>
      </div>
    </div>
  )
}
