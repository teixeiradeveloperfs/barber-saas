import { useEffect, useState } from 'react'

const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '')

export type PartnerTerms = { enabled: boolean; kind: 'PERCENTUAL' | 'FIXO'; value: number; months: number; holdDays: number; minPayoutCents: number; label: string }

/** Até a API responder: as regras de lançamento. */
export const DEFAULT_TERMS: PartnerTerms = { enabled: true, kind: 'PERCENTUAL', value: 20, months: 0, holdDays: 10, minPayoutCents: 5000, label: '20% de cada mensalidade paga, enquanto a barbearia for assinante' }

/** Regras do programa de parceiros definidas no painel. */
export function usePartnerTerms() {
  const [terms, setTerms] = useState<PartnerTerms>(DEFAULT_TERMS)
  useEffect(() => {
    if (!API_URL) return
    fetch(`${API_URL}/platform/affiliates/terms`)
      .then((response) => (response.ok ? (response.json() as Promise<PartnerTerms>) : null))
      .then((value) => value && setTerms(value))
      .catch(() => undefined)
  }, [])
  return terms
}
