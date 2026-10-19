import { useId, useState, type InputHTMLAttributes } from 'react'
import { EyeIcon, EyeOffIcon } from '../icons/Icons'
import styles from './TextField.module.css'

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  /** Mostra o botão de revelar senha. Só faz sentido com `type="password"`. */
  revealable?: boolean
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  revealable = false,
  type = 'text',
  id,
  className,
  ...rest
}: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const [revealed, setRevealed] = useState(false)

  const inputType = revealable && revealed ? 'text' : type
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={[styles.field, error && styles.hasError, className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>

      <div className={styles.control}>
        <input
          {...rest}
          id={inputId}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={styles.input}
        />
        {revealable && (
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setRevealed((state) => !state)}
            aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={revealed}
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
