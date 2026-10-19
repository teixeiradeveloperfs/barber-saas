import { useId } from 'react'
import styles from './Select.module.css'

export type SelectOption<T extends string> = { value: T; label: string }

type SelectProps<T extends string> = {
  label: string
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  hint?: string
  error?: string
  id?: string
  className?: string
}

export function Select<T extends string>({ label, value, onChange, options, hint, error, id, className }: SelectProps<T>) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={[styles.field, error && styles.hasError, className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <select id={inputId} className={styles.select} value={value} onChange={(event) => onChange(event.target.value as T)} aria-invalid={error ? true : undefined}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          ⌄
        </span>
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
