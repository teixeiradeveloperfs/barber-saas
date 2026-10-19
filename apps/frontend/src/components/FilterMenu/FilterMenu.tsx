import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getBarbers } from '../../data/home'
import { Button } from '../Button/Button'
import { Popover } from '../Popover/Popover'
import { Segmented } from '../Segmented/Segmented'
import { Switch } from '../Switch/Switch'
import { SlidersIcon } from '../icons/Icons'
import styles from './FilterMenu.module.css'
import {
  getAllSpecialties,
  applyFilters,
  countActive,
  defaultFilters,
  filtersToSearch,
  orderOptions,
  parseFilters,
  type Filters,
} from './filters'

type FilterMenuProps = {
  /** Classe do botão que abre o painel. */
  className?: string
}

/** Filtros da equipe. Aplicar leva para /barbeiros com os filtros na URL. */
export function FilterMenu({ className }: FilterMenuProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const active = parseFilters(params)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Filters>(active)

  const activeCount = countActive(active)
  const preview = applyFilters(getBarbers(), draft).length

  function toggleOpen() {
    if (!open) setDraft(active)
    setOpen((state) => !state)
  }

  function toggleSpecialty(item: string) {
    setDraft((state) => ({
      ...state,
      specialties: state.specialties.includes(item)
        ? state.specialties.filter((value) => value !== item)
        : [...state.specialties, item],
    }))
  }

  function apply() {
    setOpen(false)
    navigate(`/barbeiros${filtersToSearch(draft, params)}`)
  }

  function clear() {
    setDraft(defaultFilters)
  }

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      title="Filtrar barbeiros"
      width={340}
      trigger={(aria) => (
        <button
          type="button"
          className={[styles.trigger, className].filter(Boolean).join(' ')}
          onClick={toggleOpen}
          aria-label={activeCount ? `Filtros, ${activeCount} ativos` : 'Filtros'}
          {...aria}
        >
          <SlidersIcon />
          {activeCount > 0 && (
            <span className={styles.badge} aria-hidden="true">
              {activeCount}
            </span>
          )}
        </button>
      )}
    >
      <header className={styles.head}>
        <h2 className={styles.title}>Filtrar barbeiros</h2>
        {countActive(draft) > 0 && (
          <button type="button" className={styles.clear} onClick={clear}>
            Limpar
          </button>
        )}
      </header>

      <div className={styles.switches}>
        <Switch
          label="Disponível hoje"
          description="Só quem tem horário livre ainda hoje."
          checked={draft.today}
          onChange={(value) => setDraft((state) => ({ ...state, today: value }))}
        />
        <Switch
          label="Só barbeiros Pro"
          checked={draft.pro}
          onChange={(value) => setDraft((state) => ({ ...state, pro: value }))}
        />
      </div>

      <div className={styles.block}>
        <span className={styles.label}>Especialidade</span>
        <div className={styles.chips} role="group" aria-label="Especialidade">
          {getAllSpecialties().map((item) => {
            const on = draft.specialties.includes(item)
            return (
              <button
                key={item}
                type="button"
                className={[styles.chip, on && styles.chipOn].filter(Boolean).join(' ')}
                aria-pressed={on}
                onClick={() => toggleSpecialty(item)}
              >
                {item}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.block}>
        <span className={styles.label}>Ordenar por</span>
        <Segmented
          aria-label="Ordenar por"
          options={orderOptions}
          value={draft.order}
          onChange={(value) => setDraft((state) => ({ ...state, order: value }))}
        />
      </div>

      <footer className={styles.foot}>
        <Button size="lg" block onClick={apply} disabled={preview === 0}>
          {preview === 0
            ? 'Nenhum barbeiro com esses filtros'
            : `Ver ${preview} ${preview === 1 ? 'barbeiro' : 'barbeiros'}`}
        </Button>
      </footer>
    </Popover>
  )
}
