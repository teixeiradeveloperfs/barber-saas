import { useId, type ReactNode } from 'react'
import { CheckIcon } from '../icons/Icons'
import styles from './Checkbox.module.css'

type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  error?: string
  id?: string
}

export function Checkbox({ checked, onChange, children, error, id }: CheckboxProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`

  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId} className={styles.checkbox}>
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={styles.input}
        />
        <span className={[styles.box, error && styles.boxError].filter(Boolean).join(' ')} aria-hidden="true">
          <CheckIcon className={styles.check} />
        </span>
        <span className={styles.text}>{children}</span>
      </label>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
