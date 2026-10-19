import { Fragment, useEffect, type ReactNode } from 'react'
import { useLinks } from '../settings-context'
import { CheckIcon } from '../ui/Icons'
import { LogoMark } from '../ui/Logo'
import { COMPANY, LEGAL_UPDATED } from './company'
import { DOCUMENTS, type LegalDocument } from './documents'
import styles from './LegalPage.module.css'

const LINK_TOKENS = /\[\[(whatsapp|instagram|termos|privacidade|parceiros)\]\]/g

/** Termos, privacidade e termos de parceiros: uma página por documento, mesmo layout. */
export function LegalPage({ doc }: { doc: LegalDocument }) {
  const links = useLinks()

  useEffect(() => {
    document.title = `${doc.title} · Sua Barbearia`
  }, [doc.title])

  function rich(text: string): ReactNode {
    const parts = text.split(LINK_TOKENS)
    return parts.map((part, index) => {
      if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>
      if (part === 'whatsapp')
        return (
          <a key={index} href={links.contact} target="_blank" rel="noreferrer">
            WhatsApp oficial
          </a>
        )
      if (part === 'instagram')
        return (
          <a key={index} href={COMPANY.instagram} target="_blank" rel="noreferrer">
            {COMPANY.instagramHandle}
          </a>
        )
      if (part === 'termos') return <a key={index} href="/termos">Termos de Uso</a>
      if (part === 'privacidade') return <a key={index} href="/privacidade">Política de Privacidade</a>
      return <a key={index} href="/termos-parceiros">Termos do Programa de Parceiros</a>
    })
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <a href="/" className={styles.brand} aria-label="Sua Barbearia, voltar ao site">
          <LogoMark size={28} />
          <span>
            Sua <b>Barbearia</b>
          </span>
        </a>
        <nav className={styles.switch} aria-label="Documentos">
          {DOCUMENTS.map((item) => (
            <a key={item.path} href={item.path} aria-current={item.path === doc.path ? 'page' : undefined}>
              {item.path === '/termos' ? 'Termos' : item.path === '/privacidade' ? 'Privacidade' : 'Parceiros'}
            </a>
          ))}
        </nav>
      </header>

      <main className={styles.layout}>
        <div className={styles.head}>
          <p className="eyebrow">Documento legal</p>
          <h1 className={styles.title}>{doc.title}</h1>
          <p className={styles.meta}>
            Atualizado em {LEGAL_UPDATED} · {COMPANY.legalName} · CNPJ {COMPANY.cnpj}
          </p>
        </div>

        <aside className={styles.toc} aria-label="Nesta página">
          <span className={styles.tocTitle}>Nesta página</span>
          <ol>
            {doc.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title.replace(/^\d+\.\s*/, '')}</a>
              </li>
            ))}
          </ol>
        </aside>

        <article className={styles.article}>
          <section className={styles.summary} aria-label="Resumo">
            <h2>Em poucas palavras</h2>
            <ul>
              {doc.summary.map((item) => (
                <li key={item}>
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>O resumo ajuda a ler, mas o que vale é o texto completo abaixo.</p>
          </section>

          {doc.sections.map((section) => (
            <section key={section.id} id={section.id} className={styles.section}>
              <h2>{section.title}</h2>
              {section.body.map((block, index) =>
                Array.isArray(block) ? (
                  <ul key={index}>
                    {block.map((item) => (
                      <li key={item}>{rich(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={index}>{rich(block)}</p>
                ),
              )}
            </section>
          ))}

          <footer className={styles.sign}>
            <strong>{COMPANY.legalName}</strong>
            <span>
              CNPJ {COMPANY.cnpj} · {COMPANY.city}
            </span>
            <span>
              <a href={links.contact} target="_blank" rel="noreferrer">
                WhatsApp
              </a>{' '}
              ·{' '}
              <a href={COMPANY.instagram} target="_blank" rel="noreferrer">
                Instagram {COMPANY.instagramHandle}
              </a>
            </span>
          </footer>
        </article>
      </main>
    </div>
  )
}
