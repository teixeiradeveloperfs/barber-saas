import { useId, useState } from 'react'
import { assetUrl } from '../../api/admin'
import { MediaPicker } from '../../media/MediaPicker'
import { useMediaScope } from '../../media/media-scope'
import { Button } from '../../ui/Button/Button'
import styles from './fields.module.css'

type ImageFieldProps = {
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  hint?: string
  error?: string
  /** Proporção da miniatura. */
  aspect?: 'square' | 'wide'
  required?: boolean
  /** Barbearia do banco de imagens. Sem ela, vale a do contexto (área da barbearia); sem nenhuma, só URL digitada. */
  installationId?: string
}

/** URL de imagem com miniatura e, quando há barbearia, o seletor do banco de imagens (galeria, upload ou link). */
export function ImageField({ label, value, onChange, hint, error, aspect = 'wide', required = false, installationId }: ImageFieldProps) {
  const id = useId()
  const contextScope = useMediaScope()
  const scope = installationId ?? contextScope
  const [picking, setPicking] = useState(false)

  const thumbClass = [styles.thumb, aspect === 'square' ? styles.thumbSquare : styles.thumbWide].join(' ')
  const preview = value ? (
    <img src={assetUrl(value)} alt="" onError={(event) => (event.currentTarget.style.visibility = 'hidden')} onLoad={(event) => (event.currentTarget.style.visibility = 'visible')} />
  ) : (
    <span>Sem imagem</span>
  )

  return (
    <div className={[styles.field, error && styles.hasError].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.imageRow}>
        {scope ? (
          <button type="button" className={[thumbClass, styles.thumbButton].join(' ')} onClick={() => setPicking(true)} aria-label={`Escolher imagem: ${label}`}>
            {preview}
          </button>
        ) : (
          <div className={thumbClass} aria-hidden="true">
            {preview}
          </div>
        )}
        <input
          id={id}
          className={styles.input}
          value={value ?? ''}
          placeholder="https://… ou /images/arquivo.jpg"
          inputMode="url"
          spellCheck={false}
          autoCapitalize="off"
          onChange={(event) => {
            const next = event.target.value.trim()
            onChange(next === '' && !required ? undefined : next)
          }}
          aria-invalid={error ? true : undefined}
        />
        {scope && (
          <Button type="button" variant="ghost" size="lg" onClick={() => setPicking(true)}>
            Escolher
          </Button>
        )}
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {scope && picking && (
        <MediaPicker
          installationId={scope}
          aspect={aspect}
          title={`Escolher imagem: ${label}`}
          onClose={() => setPicking(false)}
          onPick={(url) => {
            onChange(url)
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}
