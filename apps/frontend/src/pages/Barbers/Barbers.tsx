import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { FilterMenu } from '../../components/FilterMenu/FilterMenu'
import { applyFilters, filtersToSearch, orderOptions, parseFilters, type Filters } from '../../components/FilterMenu/filters'
import { ScissorsIcon } from '../../components/ScissorsIcon/ScissorsIcon'
import { XIcon } from '../../components/icons/Icons'
import { formatDuration, formatPrice, getService } from '../../data/barbers'
import { getBarbers } from '../../data/home'
import { TeamCard } from '../Home/TeamCard'
import styles from './Barbers.module.css'

export function Barbers() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const barbers = getBarbers()
  const filters = parseFilters(params)
  const visible = applyFilters(barbers, filters)

  const serviceIds = (params.get('servico') ?? '').split(',').filter(Boolean)
  const chosen = serviceIds
    .map((id) => getService(id))
    .filter((service): service is NonNullable<typeof service> => Boolean(service))
  const bookingQuery = chosen.length ? `?servico=${chosen.map((service) => service.id).join(',')}` : ''

  function update(next: Filters) {
    navigate(`/barbeiros${filtersToSearch(next, params)}`, { replace: true })
  }

  const activeChips: { label: string; onRemove: () => void }[] = [
    ...(filters.today ? [{ label: 'Disponível hoje', onRemove: () => update({ ...filters, today: false }) }] : []),
    ...(filters.pro ? [{ label: 'Só Pro', onRemove: () => update({ ...filters, pro: false }) }] : []),
    ...filters.specialties.map((item) => ({
      label: item,
      onRemove: () => update({ ...filters, specialties: filters.specialties.filter((value) => value !== item) }),
    })),
    ...(filters.order !== 'avaliacao'
      ? [
          {
            label: `Ordem: ${orderOptions.find((option) => option.value === filters.order)?.label ?? ''}`,
            onRemove: () => update({ ...filters, order: 'avaliacao' }),
          },
        ]
      : []),
  ]

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Nossos barbeiros</h1>
          <p className={styles.subtitle}>
            {visible.length === barbers.length
              ? 'Escolha com quem cortar. Toda a equipe atende o catálogo completo de serviços.'
              : `${visible.length} de ${barbers.length} barbeiros com os filtros escolhidos.`}
          </p>
        </div>
        <FilterMenu className={styles.filterButton} />
      </header>

      {chosen.length > 0 && (
        <div className={styles.picked} role="status">
          <ScissorsIcon className={styles.pickedIcon} />
          <span className={styles.pickedText}>
            Agendando <strong>{chosen.map((service) => service.name).join(' + ')}</strong>
            <span className={styles.pickedMeta}>
              {' '}
              · {formatDuration(chosen.reduce((sum, service) => sum + service.durationMin, 0))} ·{' '}
              {formatPrice(chosen.reduce((sum, service) => sum + service.price, 0))}
            </span>
          </span>
          <Link to="/servicos" className={styles.pickedChange}>
            Trocar
          </Link>
          <Link to={`/barbeiros${filtersToSearch(filters)}`} className={styles.pickedClear} aria-label="Remover serviço escolhido">
            <XIcon />
          </Link>
        </div>
      )}

      {activeChips.length > 0 && (
        <div className={styles.active} aria-label="Filtros ativos">
          {activeChips.map((chip) => (
            <button key={chip.label} type="button" className={styles.activeChip} onClick={chip.onRemove}>
              {chip.label}
              <XIcon />
            </button>
          ))}
          <button
            type="button"
            className={styles.clearAll}
            onClick={() => update({ today: false, pro: false, specialties: [], order: 'avaliacao' })}
          >
            Limpar filtros
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhum barbeiro com esses filtros. Tire algum e tente de novo.</p>
          <Button variant="ghost" onClick={() => update({ today: false, pro: false, specialties: [], order: 'avaliacao' })}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((barber) => (
            <TeamCard key={barber.id} barber={barber} bookingQuery={bookingQuery} />
          ))}
        </div>
      )}
    </section>
  )
}
