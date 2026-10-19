import type { LegalDocument as LegalDocumentBase, LegalSection } from '@barber/tenant-config'
import { getTenant } from '../tenant/active'

export type { LegalSection }

export type LegalSlug = 'termos' | 'privacidade'

export type LegalDocument = LegalDocumentBase & {
  slug: LegalSlug
  related: { slug: LegalSlug; label: string }
}

/** Termos ou privacidade do tenant ativo, com o link para o outro documento. */
export function getLegalDocument(slug: LegalSlug): LegalDocument {
  const { legal } = getTenant()
  if (slug === 'termos') {
    return { ...legal.terms, slug, related: { slug: 'privacidade', label: legal.privacy.title } }
  }
  return { ...legal.privacy, slug, related: { slug: 'termos', label: legal.terms.title } }
}
