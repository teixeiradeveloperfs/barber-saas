import { useId } from 'react'
import { XIcon } from '../../ui/icons/Icons'
import styles from './fields.module.css'

type ColorFieldProps = {
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  /** Sem valor, o app deriva a cor sozinho. */
  optional?: boolean
  hint?: string
  error?: string
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function ColorField({ label, value, onChange, optional = false, hint, error }: ColorFieldProps) {
  const id = useId()
  const swatch = value && HEX.test(value) ? value : '#888888'
  return (
    <div className={[styles.field, error && styles.hasError].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.colorRow}>
        <label className={styles.swatch} style={{ background: swatch }} aria-label={`Escolher ${label}`}>
          <input type="color" value={swatch} onChange={(event) => onChange(event.target.value)} />
        </label>
        <input
          id={id}
          className={styles.input}
          value={value ?? ''}
          placeholder={optional ? 'Automática' : '#000000'}
          spellCheck={false}
          autoCapitalize="off"
          onChange={(event) => {
            const next = event.target.value.trim()
            onChange(next === '' && optional ? undefined : next)
          }}
          aria-invalid={error ? true : undefined}
        />
        {optional && value !== undefined && (
          <button type="button" className={styles.clear} onClick={() => onChange(undefined)} aria-label={`Voltar ${label} para automática`}>
            <XIcon />
          </button>
        )}
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}
