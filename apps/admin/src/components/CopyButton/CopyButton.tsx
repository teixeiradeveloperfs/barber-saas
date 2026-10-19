import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from '../../ui/icons/Icons'
import styles from './CopyButton.module.css'

export function CopyButton({ value, label = 'Copiar' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      window.prompt('Copie o valor:', value)
    }
  }

  return (
    <button type="button" className={[styles.button, copied && styles.copied].filter(Boolean).join(' ')} onClick={copy} aria-label={copied ? 'Copiado' : `${label}: ${value}`}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? 'Copiado' : label}</span>
    </button>
  )
}
