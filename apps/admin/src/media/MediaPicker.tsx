import { useState, type DragEvent } from 'react'
import { adminApi, assetUrl, type MediaAsset } from '../api/admin'
import { isManagerRole, useTenantRole } from '../auth/useTenantRole'
import { errorMessage } from '../lib/format'
import { useResource } from '../lib/useResource'
import { Button } from '../ui/Button/Button'
import { Checkbox } from '../ui/Checkbox/Checkbox'
import { Dialog } from '../ui/Dialog/Dialog'
import { Segmented, type SegmentedOption } from '../ui/Segmented/Segmented'
import { TextField } from '../ui/TextField/TextField'
import { MEDIA_ACCEPT, fitsContained, isImageUrl } from './media'
import styles from './MediaPicker.module.css'

type Tab = 'galeria' | 'enviar' | 'link'

type Props = {
  installationId: string
  onClose: () => void
  /** Recebe a URL escolhida; quem abriu fecha o seletor. */
  onPick: (url: string) => void
  aspect?: 'square' | 'wide'
  title?: string
}

/** Seletor de imagem: galeria (barbearia + plataforma), upload na hora ou link colado. */
export function MediaPicker({ installationId, onClose, onPick, aspect = 'wide', title = 'Escolher imagem' }: Props) {
  const role = useTenantRole(installationId)
  const canManage = isManagerRole(role)
  const library = useResource(() => adminApi.listMedia(installationId), [installationId])
  const [tab, setTab] = useState<Tab>('galeria')
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [link, setLink] = useState('')
  const [previewBroken, setPreviewBroken] = useState(false)
  const [saveLink, setSaveLink] = useState(true)
  const [saving, setSaving] = useState(false)

  const tabs: SegmentedOption<Tab>[] = [
    { value: 'galeria', label: 'Galeria' },
    ...(canManage ? [{ value: 'enviar' as const, label: 'Enviar arquivo' }] : []),
    { value: 'link', label: 'Colar link' },
  ]

  async function upload(file: File | undefined) {
    if (!file || uploading) return
    setError(null)
    setUploading(true)
    try {
      const asset = await adminApi.uploadMedia(installationId, file)
      onPick(asset.url)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setUploading(false)
    }
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setDragging(false)
    void upload(event.dataTransfer.files[0])
  }

  async function useLink() {
    const url = link.trim()
    if (!isImageUrl(url)) {
      setError('Cole um link começando com https:// (ou um caminho do app começando com /).')
      return
    }
    setError(null)
    if (saveLink && canManage) {
      setSaving(true)
      try {
        await adminApi.addMediaLink(installationId, url)
      } catch (caught) {
        setError(errorMessage(caught))
        setSaving(false)
        return
      }
      setSaving(false)
    }
    onPick(url)
  }

  const actions = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={uploading || saving}>
        Cancelar
      </Button>
      {tab === 'galeria' && (
        <Button onClick={() => selected && onPick(selected)} disabled={!selected}>
          Usar imagem
        </Button>
      )}
      {tab === 'link' && (
        <Button onClick={useLink} loading={saving} disabled={link.trim() === ''}>
          Usar link
        </Button>
      )}
    </>
  )

  const preview = link.trim()

  return (
    <Dialog open onClose={onClose} title={title} actions={actions} size="lg">
      <div className={styles.body}>
        <Segmented
          aria-label="Origem da imagem"
          options={tabs}
          value={tab}
          onChange={(next) => {
            setTab(next)
            setError(null)
          }}
        />

        {tab === 'galeria' && (
          <div className={styles.scroll}>
            {library.loading && !library.data && <p className={styles.muted}>Carregando…</p>}
            {library.error && !library.data && (
              <p className={styles.error} role="alert">
                {library.error}
              </p>
            )}
            {library.data && (
              <>
                <Section
                  title="Suas imagens"
                  assets={library.data.own}
                  empty={canManage ? 'Nada aqui ainda. Envie um arquivo ou cole um link: o que você usar fica salvo para a próxima vez.' : 'A barbearia ainda não tem imagens salvas.'}
                  aspect={aspect}
                  selected={selected}
                  onSelect={setSelected}
                  onPick={onPick}
                />
                <Section
                  title="Biblioteca Sua Barbearia"
                  assets={library.data.platform}
                  empty="A plataforma ainda não disponibilizou imagens."
                  aspect={aspect}
                  selected={selected}
                  onSelect={setSelected}
                  onPick={onPick}
                />
              </>
            )}
          </div>
        )}

        {tab === 'enviar' && (
          <label
            className={[styles.drop, dragging && styles.dropActive, uploading && styles.dropBusy].filter(Boolean).join(' ')}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept={MEDIA_ACCEPT}
              className={styles.fileInput}
              disabled={uploading}
              data-testid="media-file"
              onChange={(event) => {
                void upload(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            <strong>{uploading ? 'Enviando…' : 'Arraste uma imagem ou clique para escolher'}</strong>
            <span>JPG, PNG, WebP, GIF, AVIF ou SVG, até 8 MB. Fica salva em Suas imagens.</span>
          </label>
        )}

        {tab === 'link' && (
          <div className={styles.linkForm}>
            <TextField
              label="Link da imagem"
              value={link}
              onChange={(value) => {
                setLink(value)
                setPreviewBroken(false)
              }}
              placeholder="https://…"
              inputMode="url"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
              hint="Endereço público da imagem ou caminho do app (/images/…)."
            />
            <div className={styles.linkPreview} aria-hidden="true">
              {preview && isImageUrl(preview) && !previewBroken ? (
                <img key={preview} src={assetUrl(preview)} alt="" onError={() => setPreviewBroken(true)} />
              ) : (
                <span>{previewBroken ? 'Não foi possível carregar essa imagem' : 'Prévia'}</span>
              )}
            </div>
            {canManage && (
              <Checkbox checked={saveLink} onChange={setSaveLink}>
                Salvar em Suas imagens para usar de novo
              </Checkbox>
            )}
          </div>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}

type SectionProps = {
  title: string
  assets: MediaAsset[]
  empty: string
  aspect: 'square' | 'wide'
  selected: string | null
  onSelect: (url: string) => void
  onPick: (url: string) => void
}

function Section({ title, assets, empty, aspect, selected, onSelect, onPick }: SectionProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {assets.length === 0 ? (
        <p className={styles.muted}>{empty}</p>
      ) : (
        <div className={styles.grid}>
          {assets.map((asset) => {
            const active = selected === asset.url
            const meta = asset.width && asset.height ? `${asset.width}×${asset.height}` : asset.source === 'LINK' ? 'Link' : null
            return (
              <button
                key={asset.id}
                type="button"
                className={[styles.tile, active && styles.tileActive].filter(Boolean).join(' ')}
                aria-pressed={active}
                title={asset.name}
                onClick={() => onSelect(asset.url)}
                onDoubleClick={() => onPick(asset.url)}
              >
                <span className={[styles.thumb, aspect === 'square' ? styles.square : styles.wide, fitsContained(asset) && styles.contain].filter(Boolean).join(' ')}>
                  <img src={assetUrl(asset.url)} alt="" loading="lazy" />
                </span>
                <span className={styles.caption}>
                  <span className={styles.name}>{asset.name}</span>
                  {meta && <span className={styles.meta}>{meta}</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
