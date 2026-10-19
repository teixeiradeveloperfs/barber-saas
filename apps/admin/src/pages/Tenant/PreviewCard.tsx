import { useEffect, useState } from 'react'
import { adminApi, previewUrl, type TenantDetail } from '../../api/admin'
import { Card } from '../../components/Card/Card'
import { errorMessage } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { MonitorIcon, RepeatIcon, ShareIcon, SmartphoneIcon } from '../../ui/icons/Icons'
import styles from './PreviewCard.module.css'

type Device = 'celular' | 'desktop'

type PreviewCardProps = { tenant: TenantDetail; compact?: boolean; /** Mude para forçar recarga do iframe (ex.: após salvar). */ refreshKey?: number }

export function PreviewCard({ tenant, compact = false, refreshKey = 0 }: PreviewCardProps) {
  // Guarda só o token: a URL sai do host da barbearia a cada render.
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [device, setDevice] = useState<Device>('celular')
  const [reloadKey, setReloadKey] = useState(0)

  const draftVersion = tenant.configs.draft?.version
  const draftAt = tenant.configs.draft?.at
  const publishedVersion = tenant.configs.published?.version

  const [attempt, setAttempt] = useState(0)

  // Gera um link de preview assinado; `attempt` permite tentar de novo.
  useEffect(() => {
    let cancelled = false
    adminApi
      .previewToken(tenant.id)
      .then((result) => {
        if (cancelled) return
        setError(null)
        setToken(result.token)
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(errorMessage(caught, 'Não foi possível gerar o preview.'))
      })
    return () => {
      cancelled = true
    }
  }, [tenant.id, attempt])

  const url = token ? previewUrl(tenant, token) : null

  const showing = draftVersion ? `rascunho v${draftVersion}` : publishedVersion ? `versão publicada v${publishedVersion}` : 'modelo padrão'

  return (
    <Card
      stackHeader={compact}
      title={compact ? 'Preview' : 'Preview ao vivo'}
      description={compact ? `Mostrando ${showing}. Atualiza ao salvar o rascunho.` : `Mostrando ${showing}. É o app real dos clientes, apontado para esta barbearia.`}
      actions={
        <>
          <div className={styles.devices} role="group" aria-label="Tamanho do preview">
            <button type="button" className={[styles.device, device === 'celular' && styles.deviceActive].filter(Boolean).join(' ')} onClick={() => setDevice('celular')} aria-pressed={device === 'celular'} aria-label="Celular">
              <SmartphoneIcon />
            </button>
            <button type="button" className={[styles.device, device === 'desktop' && styles.deviceActive].filter(Boolean).join(' ')} onClick={() => setDevice('desktop')} aria-pressed={device === 'desktop'} aria-label="Desktop">
              <MonitorIcon />
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setReloadKey((value) => value + 1)} disabled={!url} aria-label="Recarregar preview">
            <RepeatIcon />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => url && window.open(url, '_blank', 'noopener')} disabled={!url}>
            <ShareIcon />
            Nova aba
          </Button>
        </>
      }
    >
      <div className={[styles.stage, device === 'celular' ? styles.stagePhone : styles.stageDesktop].join(' ')}>
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setAttempt((value) => value + 1)}>
              Tentar de novo
            </Button>
          </div>
        )}
        {url && !error && (
          <div className={styles.frame}>
            <iframe key={`${reloadKey}-${refreshKey}-${draftVersion ?? 0}-${draftAt ?? ''}-${publishedVersion ?? 0}`} src={url} title={`Preview de ${tenant.name}`} className={styles.iframe} loading="lazy" />
          </div>
        )}
      </div>
      {!compact && (
        <p className={styles.note}>
          O link de preview vale por 2 horas e mostra o rascunho mesmo antes de publicar.
        </p>
      )}
    </Card>
  )
}
