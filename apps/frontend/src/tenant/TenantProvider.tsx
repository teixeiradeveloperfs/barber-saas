import { useEffect, useState, type ReactNode } from 'react'
import type { AppConfig } from '@barber/tenant-config'
import { setActiveTenant } from './active'
import { resolveTenant, TenantError, type TenantErrorKind } from './resolve'
import { TenantContext } from './tenant-context'
import { applyTenantDocument, applyTenantTheme } from './theme'
import styles from './TenantProvider.module.css'
import { captureReferralCode } from '../lib/api'

type Status = { kind: 'loading' } | { kind: 'ready'; config: AppConfig } | { kind: 'error'; reason: TenantErrorKind; message: string }

const COPY: Record<TenantErrorKind, { title: string; text: string }> = {
  'sem-barbearia': {
    title: 'Nenhuma barbearia neste endereço.',
    text: 'Este endereço ainda não está ligado a uma barbearia. Se você é o dono, conecte o domínio pelo painel.',
  },
  'nao-publicado': {
    title: 'Esta barbearia ainda não publicou o app.',
    text: 'Falta publicar a primeira versão no painel. Volte em instantes.',
  },
  'api-indisponivel': {
    title: 'Não deu para carregar agora.',
    text: 'Nossos servidores não responderam. Confira sua conexão ou tente de novo em instantes.',
  },
}

/**
 * Carrega o tenant antes de qualquer tela, aplica marca e tema, e expõe o
 * config por contexto e pelo singleton usado nos helpers de dados.
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    resolveTenant()
      .then((config) => {
        if (cancelled) return
        setActiveTenant(config)
        // Link de indicação (?indicacao=): guarda até a pessoa criar a conta.
        captureReferralCode()
        applyTenantTheme(config)
        applyTenantDocument(config)
        setStatus({ kind: 'ready', config })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const reason: TenantErrorKind = error instanceof TenantError ? error.kind : 'api-indisponivel'
        setStatus({ kind: 'error', reason, message: error instanceof Error ? error.message : String(error) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (status.kind === 'loading') {
    return <div className={styles.screen} aria-busy="true" aria-label="Carregando" />
  }

  if (status.kind === 'error') {
    const copy = COPY[status.reason]
    return (
      <div className={styles.screen} role="alert">
        <div className={styles.error}>
          <span className={styles.mark} aria-hidden="true" />
          <h1>{copy.title}</h1>
          <p>{copy.text}</p>
          {status.reason === 'api-indisponivel' && (
            <button type="button" className={styles.retry} onClick={() => window.location.reload()}>
              Tentar de novo
            </button>
          )}
          {import.meta.env.DEV && <code>{status.message}</code>}
        </div>
      </div>
    )
  }

  return <TenantContext.Provider value={status.config}>{children}</TenantContext.Provider>
}
