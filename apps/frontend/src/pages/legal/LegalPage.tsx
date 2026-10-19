import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo/Logo'
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle'
import { ArrowLeftIcon, ArrowRightIcon } from '../../components/icons/Icons'
import { getLegalDocument, type LegalDocument, type LegalSlug } from '../../data/legal'
import { useBack } from '../../lib/useBack'
import styles from './LegalPage.module.css'

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = getLegalDocument(slug)
  const back = useBack('/')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button type="button" className={styles.back} onClick={back}>
            <ArrowLeftIcon />
            Voltar
          </button>
          <Link to="/" className={styles.brand} aria-label="Início">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Atualizado em {doc.updatedAt}</p>
          <h1 className={styles.title}>{doc.title}</h1>
          <p className={styles.subtitle}>{doc.subtitle}</p>
          <p className={styles.notice} role="note">
            Texto de exemplo. Substitua pelo documento revisado juridicamente antes de publicar.
          </p>
        </div>

        <div className={styles.layout}>
          <nav className={styles.toc} aria-label="Neste documento">
            <details className={styles.tocMobile}>
              <summary>Neste documento</summary>
              <TocList document={doc} />
            </details>
            <div className={styles.tocDesktop}>
              <p className={styles.tocTitle}>Neste documento</p>
              <TocList document={doc} />
            </div>
          </nav>

          <article className={styles.article}>
            {doc.sections.map((section, index) => (
              <section key={section.id} id={section.id} className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.number} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {section.title}
                </h2>
                {section.paragraphs.map((text) => (
                  <p key={text.slice(0, 40)}>{text}</p>
                ))}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <footer className={styles.related}>
              <span>Veja também</span>
              <Link to={`/${doc.related.slug}`} className={styles.relatedLink}>
                {doc.related.label}
                <ArrowRightIcon />
              </Link>
            </footer>
          </article>
        </div>
      </div>
    </div>
  )
}

function TocList({ document: doc }: { document: LegalDocument }) {
  return (
    <ol className={styles.tocList}>
      {doc.sections.map((section) => (
        <li key={section.id}>
          <a href={`#${section.id}`}>{section.title}</a>
        </li>
      ))}
    </ol>
  )
}
