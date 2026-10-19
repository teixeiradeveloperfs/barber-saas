import { useState } from 'react'
import styles from './AgendaDemo.module.css'

type Slot = { kind: 'livre' } | { kind: 'reservado'; name: string; service: string } | { kind: 'bloqueado'; reason: string } | { kind: 'passou' } | { kind: 'continua' }

const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30']
const BARBERS = ['Tony', 'Lucas', 'André']

const L: Slot = { kind: 'livre' }
const P: Slot = { kind: 'passou' }
const C: Slot = { kind: 'continua' }
const R = (name: string, service: string): Slot => ({ kind: 'reservado', name, service })
const B = (reason: string): Slot => ({ kind: 'bloqueado', reason })

/** Linhas = horários, colunas = barbeiros. */
const DAY: Slot[][] = [
  [P, P, P],
  [R('Rafael C.', 'Corte + barba'), P, R('Marcos', 'Corte')],
  [C, R('João P.', 'Barba'), L],
  [L, L, R('Pedro', 'Degradê')],
  [R('Bruno', 'Corte'), L, L],
  [L, B('Almoço'), L],
  [B('Almoço'), B('Almoço'), R('Caio S.', 'Corte + barba')],
  [L, L, C],
]

const LEGEND = [
  { kind: 'livre', label: 'Livre: o cliente vê e agenda' },
  { kind: 'reservado', label: 'Reservado: confirma, atendido ou faltou' },
  { kind: 'bloqueado', label: 'Bloqueado: almoço, folga, imprevisto' },
  { kind: 'passou', label: 'Passou: fecha sozinho' },
]

export function AgendaDemo() {
  const [taken, setTaken] = useState<Set<string>>(() => new Set())

  function toggle(key: string) {
    setTaken((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <section className="section" id="agenda">
      <div className="container">
        <div className="sectionHead" data-reveal>
          <p className="eyebrow">Agenda</p>
          <h2 className="h2">
            Meia em meia hora, do jeito que o <em>balcão</em> funciona.
          </h2>
          <p className="lead">
            Horários dentro do expediente, folga para o mesmo dia, bloqueios e agenda trancada por barbeiro. O painel mostra o dia inteiro; o cliente só vê o que está livre. Toque num horário livre
            para ver como fica reservado.
          </p>
        </div>

        <div className={styles.board} data-reveal role="group" aria-label="Exemplo interativo da grade do dia">
          <div className={styles.grid} style={{ '--cols': BARBERS.length } as React.CSSProperties}>
            <div className={styles.corner} aria-hidden="true" />
            {BARBERS.map((barber, column) => (
              <div key={barber} className={[styles.barber, column === 2 && styles.thirdCol].filter(Boolean).join(' ')}>
                <span className={styles.avatar} aria-hidden="true">
                  {barber[0]}
                </span>
                {barber}
              </div>
            ))}
            {DAY.map((row, rowIndex) => (
              <RowCells key={TIMES[rowIndex]} time={TIMES[rowIndex]} row={row} taken={taken} onToggle={toggle} />
            ))}
          </div>
        </div>

        <ul className={styles.legend} data-reveal>
          {LEGEND.map((item) => (
            <li key={item.kind}>
              <span className={[styles.swatch, styles[`swatch_${item.kind}`]].join(' ')} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

type RowProps = { time: string; row: Slot[]; taken: Set<string>; onToggle: (key: string) => void }

function RowCells({ time, row, taken, onToggle }: RowProps) {
  return (
    <>
      <div className={styles.time}>{time}</div>
      {row.map((slot, column) => {
        const key = `${time}-${column}`
        const third = column === 2 ? styles.thirdCol : ''
        if (slot.kind === 'livre') {
          const mine = taken.has(key)
          return (
            <button
              key={key}
              type="button"
              className={[styles.cell, mine ? styles.reservado : styles.livre, mine && styles.mine, third].filter(Boolean).join(' ')}
              aria-pressed={mine}
              aria-label={`${time}, ${BARBERS[column]}: ${mine ? 'reservado por você' : 'livre'}`}
              onClick={() => onToggle(key)}
            >
              {mine ? (
                <>
                  <strong>Você</strong>
                  <span>Corte</span>
                </>
              ) : (
                <span>Livre</span>
              )}
            </button>
          )
        }
        if (slot.kind === 'reservado') {
          return (
            <div key={key} className={[styles.cell, styles.reservado, third].filter(Boolean).join(' ')}>
              <strong>{slot.name}</strong>
              <span>{slot.service}</span>
            </div>
          )
        }
        if (slot.kind === 'bloqueado') {
          return (
            <div key={key} className={[styles.cell, styles.bloqueado, third].filter(Boolean).join(' ')}>
              <span>{slot.reason}</span>
            </div>
          )
        }
        if (slot.kind === 'continua') {
          return <div key={key} className={[styles.cell, styles.continua, third].filter(Boolean).join(' ')} aria-label="continuação do atendimento anterior" />
        }
        return (
          <div key={key} className={[styles.cell, styles.passou, third].filter(Boolean).join(' ')}>
            <span>Passou</span>
          </div>
        )
      })}
    </>
  )
}
