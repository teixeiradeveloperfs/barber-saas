import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/Avatar/Avatar'
import { FilterMenu } from '../../components/FilterMenu/FilterMenu'
import { ScissorsIcon } from '../../components/ScissorsIcon/ScissorsIcon'
import { ClockIcon, SearchIcon, StarIcon, XIcon } from '../../components/icons/Icons'
import { formatDuration, formatPrice } from '../../data/barbers'
import { formatRating } from '../../data/home'
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '../../search/recent'
import { quickSearches, searchAll } from '../../search/search'
import { useTenant } from '../../tenant/useTenant'
import styles from './SearchBar.module.css'

export function SearchBar() {
  const navigate = useNavigate()
  const { copy } = useTenant()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>(getRecentSearches)

  const results = useMemo(() => searchAll(query), [query])
  const hasQuery = query.trim().length > 0
  const isEmpty = hasQuery && results.barbers.length === 0 && results.services.length === 0

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  function go(to: string, term: string) {
    setRecent(addRecentSearch(term))
    setOpen(false)
    setQuery('')
    navigate(to)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (results.barbers[0]) return go(`/agendar/${results.barbers[0].id}`, query)
    if (results.services[0]) return go(`/barbeiros?servico=${results.services[0].id}`, query)
  }

  function pick(term: string) {
    setQuery(term)
    setOpen(true)
    inputRef.current?.focus()
  }

  return (
    <form className={styles.search} role="search" onSubmit={handleSubmit} noValidate>
      {/* Só o campo e o painel ficam no wrapper de "clique fora"; o botão de
          filtros é irmão, então abrir filtros fecha a busca. */}
      <div ref={rootRef} className={styles.root}>
        <label className={styles.field}>
          <span className="visually-hidden">Buscar barbeiros ou serviços</span>
          <input
            ref={inputRef}
            type="search"
            name="q"
            placeholder={copy.searchPlaceholder}
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
          />
          {query ? (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Limpar busca"
            >
              <XIcon />
            </button>
          ) : (
            <SearchIcon className={styles.icon} />
          )}
        </label>

        {open && (
          <div id={listId} className={styles.panel} role="region" aria-label="Resultados da busca">
          {!hasQuery && (
            <>
              {recent.length > 0 && (
                <section className={styles.group}>
                  <header className={styles.groupHead}>
                    <span className={styles.groupTitle}>Buscas recentes</span>
                    <button
                      type="button"
                      className={styles.groupAction}
                      onClick={() => setRecent(clearRecentSearches())}
                    >
                      Limpar
                    </button>
                  </header>
                  <ul className={styles.list}>
                    {recent.map((term) => (
                      <li key={term}>
                        <button type="button" className={styles.row} onClick={() => pick(term)}>
                          <span className={styles.rowIcon}>
                            <ClockIcon />
                          </span>
                          <span className={styles.rowText}>
                            <span className={styles.rowTitle}>{term}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section className={styles.group}>
                <header className={styles.groupHead}>
                  <span className={styles.groupTitle}>Sugestões</span>
                </header>
                <div className={styles.chips}>
                  {quickSearches.map((term) => (
                    <button key={term} type="button" className={styles.chip} onClick={() => pick(term)}>
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {hasQuery && results.barbers.length > 0 && (
            <section className={styles.group}>
              <header className={styles.groupHead}>
                <span className={styles.groupTitle}>Barbeiros</span>
              </header>
              <ul className={styles.list}>
                {results.barbers.map((barber) => (
                  <li key={barber.id}>
                    <button type="button" className={styles.row} onClick={() => go(`/agendar/${barber.id}`, barber.name)}>
                      <Avatar name={barber.name} src={barber.image} size={36} />
                      <span className={styles.rowText}>
                        <span className={styles.rowTitle}>{barber.name}</span>
                        <span className={styles.rowHint}>{barber.specialties.join(' · ')}</span>
                      </span>
                      <span className={styles.rowMeta}>
                        <StarIcon className={styles.star} />
                        {formatRating(barber.rating)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasQuery && results.services.length > 0 && (
            <section className={styles.group}>
              <header className={styles.groupHead}>
                <span className={styles.groupTitle}>Serviços</span>
              </header>
              <ul className={styles.list}>
                {results.services.map((service) => (
                  <li key={service.id}>
                    <button
                      type="button"
                      className={styles.row}
                      onClick={() => go(`/barbeiros?servico=${service.id}`, service.name)}
                    >
                      <span className={styles.rowIcon}>
                        <ScissorsIcon className={styles.scissors} />
                      </span>
                      <span className={styles.rowText}>
                        <span className={styles.rowTitle}>{service.name}</span>
                        <span className={styles.rowHint}>{formatDuration(service.durationMin)}</span>
                      </span>
                      <span className={styles.rowMeta}>{formatPrice(service.price)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isEmpty && (
            <p className={styles.empty}>
              Nada para "<strong>{query}</strong>". Tente o nome de um barbeiro ou de um serviço.
            </p>
          )}
          </div>
        )}
      </div>
      <FilterMenu />
    </form>
  )
}
