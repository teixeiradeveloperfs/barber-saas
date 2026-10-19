import { useId, type Ref, type TextareaHTMLAttributes } from 'react'
import styles from './TextArea.module.css'

type TextAreaProps = {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  ref?: Ref<HTMLTextAreaElement>
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>

export function TextArea({ label, value, onChange, hint, error, id, rows = 3, className, ...rest }: TextAreaProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={[styles.field, error && styles.hasError, className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <textarea
        id={inputId}
        className={styles.input}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}
