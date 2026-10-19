import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { adminApi, assetUrl, type MediaAsset } from '../../api/admin'
import { useAuth } from '../../auth/useAuth'
import { isManagerRole } from '../../auth/useTenantRole'
import { Card } from '../../components/Card/Card'
import { CopyButton } from '../../components/CopyButton/CopyButton'
import { ErrorState, Loading } from '../../components/Loading/Loading'
import { useToast } from '../../components/Toast/useToast'
import { errorMessage } from '../../lib/format'
import { useResource } from '../../lib/useResource'
import { MEDIA_ACCEPT, fitsContained, isImageUrl } from '../../media/media'
import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import { TextField } from '../../ui/TextField/TextField'
import { useTenantOutlet } from './tenant-context'
import styles from './MediaPage.module.css'

type Scope = 'own' | 'platform'
type Pending =
  | { kind: 'link'; scope: Scope }
  | { kind: 'rename'; scope: Scope; asset: MediaAsset }
  | { kind: 'remove'; scope: Scope; asset: MediaAsset }

const TYPE_LABEL: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
  'image/avif': 'AVIF',
  'image/svg+xml': 'SVG',
}

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

function describe(asset: MediaAsset) {
  const parts = [
    asset.source === 'LINK' ? 'Link' : (asset.mime && TYPE_LABEL[asset.mime]) ?? 'Arquivo',
    asset.width && asset.height ? `${asset.width}×${asset.height}` : null,
    asset.size ? formatBytes(asset.size) : null,
  ]
  return parts.filter(Boolean).join(' · ')
}

/** Banco de imagens da barbearia mais a biblioteca da plataforma. Quem escolhe uma imagem nos editores vem daqui. */
export function MediaPage() {
  const { tenant, role } = useTenantOutlet()
  const { isPlatform } = useAuth()
  const toast = useToast()
  const library = useResource(() => adminApi.listMedia(tenant.id), [tenant.id])
  const [pending, setPending] = useState<Pending | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftUrl, setDraftUrl] = useState('')
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState<Scope | null>(null)

  if (!isManagerRole(role)) return <Navigate to={`/agenda/${tenant.id}`} replace />
  if (!library.data) {
    if (library.loading) return <Loading label="Carregando imagens…" />
    return <ErrorState message={library.error ?? 'Não foi possível carregar as imagens.'} onRetry={library.reload} />
  }
  const data = library.data

  function put(scope: Scope, asset: MediaAsset) {
    library.mutate((current) => ({ ...current, [scope]: [asset, ...current[scope].filter((item) => item.id !== asset.id)] }))
  }
  function drop(scope: Scope, assetId: string) {
    library.mutate((current) => ({ ...current, [scope]: current[scope].filter((item) => item.id !== assetId) }))
  }

  async function upload(scope: Scope, file: File | undefined) {
    if (!file) return
    setUploading(scope)
    try {
      const asset = scope === 'own' ? await adminApi.uploadMedia(tenant.id, file) : await adminApi.uploadPlatformMedia(file)
      put(scope, asset)
      toast({ kind: 'ok', title: 'Imagem enviada', detail: asset.name })
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível enviar', detail: errorMessage(caught) })
    } finally {
      setUploading(null)
    }
  }

  function open(next: Pending) {
    setDialogError(null)
    setDraftName(next.kind === 'rename' ? next.asset.name : '')
    setDraftUrl('')
    setPending(next)
  }

  async function confirm() {
    if (!pending) return
    setDialogError(null)
    setBusy(true)
    try {
      if (pending.kind === 'link') {
        const url = draftUrl.trim()
        if (!isImageUrl(url)) throw new Error('Cole um link começando com https:// (ou um caminho do app começando com /).')
        const name = draftName.trim() || undefined
        const asset = pending.scope === 'own' ? await adminApi.addMediaLink(tenant.id, url, name) : await adminApi.addPlatformMediaLink(url, name)
        put(pending.scope, asset)
        toast({ kind: 'ok', title: 'Link adicionado', detail: asset.name })
      } else if (pending.kind === 'rename') {
        const name = draftName.trim()
        if (!name) throw new Error('Informe um nome.')
        const asset = pending.scope === 'own' ? await adminApi.renameMedia(tenant.id, pending.asset.id, name) : await adminApi.renamePlatformMedia(pending.asset.id, name)
        library.mutate((current) => ({ ...current, [pending.scope]: current[pending.scope].map((item) => (item.id === asset.id ? asset : item)) }))
      } else {
        if (pending.scope === 'own') await adminApi.removeMedia(tenant.id, pending.asset.id)
        else await adminApi.removePlatformMedia(pending.asset.id)
        drop(pending.scope, pending.asset.id)
        toast({ kind: 'ok', title: 'Imagem apagada', detail: pending.asset.name })
      }
      setPending(null)
    } catch (caught) {
      setDialogError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  function manageActions(scope: Scope) {
    return (
      <>
        <UploadButton scope={scope} loading={uploading === scope} onFile={(file) => void upload(scope, file)} />
        <Button size="sm" variant="ghost" onClick={() => open({ kind: 'link', scope })}>
          Adicionar link
        </Button>
      </>
    )
  }

  return (
    <div className={styles.page}>
      <Card
        title="Suas imagens"
        description="Logo, fotos e ícones desta barbearia. Aparecem no botão Escolher de qualquer campo de imagem e na foto dos barbeiros."
        actions={manageActions('own')}
      >
        <Grid
          assets={data.own}
          canManage
          empty="Nada aqui ainda. Envie um arquivo ou adicione um link."
          onRename={(asset) => open({ kind: 'rename', scope: 'own', asset })}
          onRemove={(asset) => open({ kind: 'remove', scope: 'own', asset })}
        />
      </Card>

                  <Card title="Biblioteca Sua Barbearia" description="Imagens da plataforma, disponíveis para todas as barbearias." actions={isPlatform ? manageActions('platform') : undefined}>
        <Grid
          assets={data.platform}
          canManage={isPlatform}
          empty="A plataforma ainda não disponibilizou imagens."
          onRename={(asset) => open({ kind: 'rename', scope: 'platform', asset })}
          onRemove={(asset) => open({ kind: 'remove', scope: 'platform', asset })}
        />
      </Card>

      {pending && (
        <Dialog
          open
          onClose={() => setPending(null)}
          title={pending.kind === 'link' ? 'Adicionar link' : pending.kind === 'rename' ? 'Renomear imagem' : 'Apagar imagem?'}
          actions={
            <>
              <Button variant="ghost" onClick={() => setPending(null)} disabled={busy}>
                Cancelar
              </Button>
              <Button variant={pending.kind === 'remove' ? 'danger' : 'primary'} onClick={confirm} loading={busy}>
                {pending.kind === 'link' ? 'Adicionar' : pending.kind === 'rename' ? 'Salvar' : 'Apagar'}
              </Button>
            </>
          }
        >
          <div className={styles.dialogForm}>
            {pending.kind === 'link' && (
              <>
                <TextField label="Link da imagem" value={draftUrl} onChange={setDraftUrl} placeholder="https://…" inputMode="url" autoCapitalize="off" spellCheck={false} autoFocus hint="Endereço público da imagem ou caminho do app (/images/…)." />
                <TextField label="Nome (opcional)" value={draftName} onChange={setDraftName} hint="Sem nome, usamos o final do link." />
              </>
            )}
            {pending.kind === 'rename' && <TextField label="Nome" value={draftName} onChange={setDraftName} autoFocus />}
            {pending.kind === 'remove' && (
              <>
                <p className={styles.strong}>{pending.asset.name}</p>
                <p>{pending.asset.inUse ? 'Está em uso no app: onde aparece vai ficar sem imagem até você escolher outra.' : 'Sai do banco de imagens. Isso não tem volta.'}</p>
              </>
            )}
            {dialogError && (
              <p className={styles.error} role="alert">
                {dialogError}
              </p>
            )}
          </div>
        </Dialog>
      )}
    </div>
  )
}

function UploadButton({ scope, loading, onFile }: { scope: Scope; loading: boolean; onFile: (file: File | undefined) => void }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={MEDIA_ACCEPT}
        hidden
        data-testid={`media-upload-${scope}`}
        onChange={(event) => {
          onFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <Button size="sm" onClick={() => input.current?.click()} loading={loading}>
        Enviar imagem
      </Button>
    </>
  )
}

type GridProps = {
  assets: MediaAsset[]
  canManage: boolean
  empty: string
  onRename: (asset: MediaAsset) => void
  onRemove: (asset: MediaAsset) => void
}

function Grid({ assets, canManage, empty, onRename, onRemove }: GridProps) {
  if (assets.length === 0) return <p className={styles.empty}>{empty}</p>
  return (
    <ul className={styles.grid}>
      {assets.map((asset) => (
        <li key={asset.id} className={styles.tile} data-testid="media-tile">
          <div className={[styles.thumb, fitsContained(asset) && styles.contain].filter(Boolean).join(' ')}>
            <img src={assetUrl(asset.url)} alt="" loading="lazy" />
            {asset.inUse && <span className={styles.inUse}>Em uso</span>}
          </div>
          <div className={styles.info}>
            <strong className={styles.name} title={asset.name}>
              {asset.name}
            </strong>
            <span className={styles.meta}>{describe(asset)}</span>
          </div>
          <div className={styles.actions}>
            <CopyButton value={assetUrl(asset.url) ?? asset.url} label="Copiar link" />
            {canManage && (
              <>
                <button type="button" className={styles.textButton} onClick={() => onRename(asset)}>
                  Renomear
                </button>
                <button type="button" className={[styles.textButton, styles.dangerText].join(' ')} onClick={() => onRemove(asset)}>
                  Apagar
                </button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
