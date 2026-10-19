import { useState } from 'react'
import { Button } from '../../components/Button/Button'
import { SearchIcon, SearchOffIcon, SparklesIcon } from '../../components/icons/Icons'
import { formatDuration, formatPrice, getServiceCategories, getServices } from '../../data/barbers'
import { normalize } from '../../lib/text'
import styles from './Services.module.css'


export function Services() {
  const [query, setQuery] = useState('')
  const services = getServices()
  const serviceCategories = getServiceCategories()

  const q = normalize(query.trim())
  const filtered = q
    ? services.filter(
        (service) => normalize(service.name).includes(q) || normalize(service.description).includes(q),
      )
    : services

  const groups = serviceCategories
    .map((category) => ({
      ...category,
      items: filtered.filter((service) => service.category === category.id),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Serviços</h1>
          <p className={styles.subtitle}>
            Preços e duração de cada serviço. Escolha o que quer fazer e depois o barbeiro.
          </p>
        </div>
        <label className={styles.search}>
          <SearchIcon />
          <span className="visually-hidden">Buscar serviço</span>
          <input
            type="search"
            placeholder="Buscar serviço"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
      </header>

      {groups.length === 0 ? (
        <div className={styles.empty}>
          <SearchOffIcon />
          <p>
            Nada com "<strong>{query}</strong>". Tente outro nome ou fale com a recepção.
          </p>
          <Button variant="ghost" onClick={() => setQuery('')}>
            Limpar busca
          </Button>
        </div>
      ) : (
        <div className={styles.groups}>
          {groups.map((group) => (
            <section key={group.id} className={styles.group} aria-labelledby={`cat-${group.id}`}>
              <header className={styles.groupHead}>
                <h2 id={`cat-${group.id}`} className={styles.groupTitle}>
                  {group.name}
                </h2>
                <p className={styles.groupHint}>{group.hint}</p>
              </header>

              <ul className={styles.list}>
                {group.items.map((service) => (
                  <li key={service.id} className={styles.row}>
                    <div className={styles.text}>
                      <span className={styles.nameRow}>
                        <span className={styles.name}>{service.name}</span>
                        {service.popular && (
                          <span className={styles.popular}>
                            <SparklesIcon />
                            Popular
                          </span>
                        )}
                      </span>
                      <span className={styles.description}>{service.description}</span>
                    </div>
                    <div className={styles.meta}>
                      <span className={styles.price}>{formatPrice(service.price)}</span>
                      <span className={styles.duration}>{formatDuration(service.durationMin)}</span>
                    </div>
                    <Button size="sm" to={`/barbeiros?servico=${service.id}`} className={styles.cta}>
                      Agendar
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
