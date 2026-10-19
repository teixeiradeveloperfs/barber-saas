import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { Photo } from '../../components/Photo/Photo'
import { ScissorsIcon } from '../../components/ScissorsIcon/ScissorsIcon'
import { ArrowLeftIcon, CheckIcon, HeartIcon, StarIcon } from '../../components/icons/Icons'
import { dateKey, formatDuration, formatLongDate, formatPrice, getBarber, getUpcomingDays, tierLabel } from '../../data/barbers'
import { formatRating } from '../../data/home'
import { useAppointments } from '../../appointments/useAppointments'
import { loyaltyRules, isLoyaltyEnabled } from '../../data/gamification'
import { coverageFor } from '../../gamification/plan'
import { useGamification } from '../../gamification/useGamification'
import { ApiError, referralsApi, rewardDiscount, type CustomerReward } from '../../lib/api'
import { useCustomerAuth } from '../../auth/useCustomerAuth'
import { getTenant } from '../../tenant/active'
import { GiftIcon } from '../../components/icons/Icons'
import { useSlots } from '../../appointments/useSlots'
import { useUser } from '../../user/useUser'
import { TextField } from '../../components/TextField/TextField'
import { useBack } from '../../lib/useBack'
import { SparklesIcon } from '../../components/icons/Icons'
import { SectionPlaceholder } from '../Placeholder/SectionPlaceholder'
import styles from './Booking.module.css'
import { DayPicker } from './DayPicker'
import { ServiceList } from './ServiceList'
import { SlotGrid } from './SlotGrid'
import { SummaryBar } from './SummaryBar'

export function Booking() {
  const { barberId } = useParams()
  const [params] = useSearchParams()
  const back = useBack('/home')
  const barber = getBarber(barberId)
  const { add, cancel } = useAppointments()
  const { state: loyalty, consumeCredits } = useGamification()
  const { user, updateUser } = useUser()
  const rescheduleId = params.get('reagendar')

  const days = useMemo(() => getUpcomingDays(), [])
  const firstOpen = days.find((item) => !item.closed) ?? days[0]

  const [dayKey, setDayKey] = useState(firstOpen.key)
  const [chosenTime, setChosenTime] = useState<string | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>(() =>
    (params.get('servico') ?? '').split(',').filter(Boolean),
  )
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contact, setContact] = useState(() => ({ name: user.name, phone: user.phone }))
  // Foto do que foi confirmado: depois os créditos mudam e a cobertura viva também.
  const [receipt, setReceipt] = useState<{ coveredIds: string[]; total: number; points: number; code: string; discount: number; rewardLabel: string | null } | null>(null)
  // Recompensas de indicação da conta: uma por reserva, escolhida pelo cliente.
  const { status: authStatus } = useCustomerAuth()
  const referralOn = getTenant().referral?.enabled ?? false
  const [rewards, setRewards] = useState<CustomerReward[]>([])
  const [rewardId, setRewardId] = useState<string | null>(null)
  useEffect(() => {
    if (!referralOn || authStatus !== 'logado') return
    referralsApi.me().then((data) => setRewards(data.rewards), () => setRewards([]))
  }, [referralOn, authStatus])

  const day = days.find((item) => item.key === dayKey) ?? firstOpen
  const chosenForDuration = barber ? barber.services.filter((service) => selectedServices.includes(service.id)) : []
  // Horários reais da barbearia para este dia e duração; nenhum horário embutido.
  const slotsQuery = useSlots(barber?.id, day.closed ? null : dateKey(day), chosenForDuration.reduce((sum, service) => sum + service.durationMin, 0) || 30)

  if (!barber) {
    return (
      <SectionPlaceholder
        eyebrow="Ops"
        title="Barbeiro não encontrado"
        description="O link pode estar antigo. Volte para o início e escolha um barbeiro na lista."
      />
    )
  }

  const chosen = barber.services.filter((service) => selectedServices.includes(service.id))
  const fullPrice = chosen.reduce((sum, service) => sum + service.price, 0)
  const totalMinutes = chosen.reduce((sum, service) => sum + service.durationMin, 0)
  const slots = slotsQuery.data?.slots ?? []
  // Mantém o horário escolhido se ele ainda estiver livre; senão o primeiro livre.
  const time = chosenTime && slots.some((slot) => slot.time === chosenTime && slot.available) ? chosenTime : (slots.find((slot) => slot.available)?.time ?? null)
  const slotsNotice = slotsQuery.error
    ? slotsQuery.error
    : slotsQuery.data && !slotsQuery.data.open
      ? `A agenda de ${barber.name} está fechada no momento${slotsQuery.data.closedReason ? ` (${slotsQuery.data.closedReason})` : ''}. Tente outro barbeiro.`
      : null
  const phoneDigits = contact.phone.replace(/\D/g, '')
  const contactValid = contact.name.trim().length >= 2 && phoneDigits.length >= 10
  const coverage = coverageFor(
    chosen.map((service) => service.id),
    loyalty.subscription,
  )
  const reward = rewards.find((item) => item.id === rewardId) ?? null
  const lines = chosen.map((service) => ({ id: service.id, price: service.price, covered: coverage.coveredIds.includes(service.id) }))
  const rewardCheck = reward ? rewardDiscount(reward, lines, coverage.toPay) : null
  const discount = rewardCheck?.discount ?? 0
  const total = Math.max(0, coverage.toPay - discount)
  const earnPoints = Math.round(total) + coverage.coveredIds.length * loyaltyRules().pointsPerCovered

  function selectDay(key: string) {
    setDayKey(key)
    setError(null)
  }

  function toggleService(id: string) {
    setSelectedServices((state) =>
      state.includes(id) ? state.filter((item) => item !== id) : [...state, id],
    )
  }

  async function confirm() {
    if (!time || chosen.length === 0) return
    if (!contactValid) {
      setError('Informe seu nome e WhatsApp com DDD para a barbearia te avisar.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const created = await add({
        barberId: barber!.id,
        serviceIds: chosen.map((service) => service.id),
        coveredServiceIds: coverage.coveredIds,
        date: dateKey(day),
        time,
        customer: { name: contact.name.trim(), phone: phoneDigits },
        rewardId: reward && discount > 0 ? reward.id : undefined,
      })
      if (contact.name.trim() !== user.name || contact.phone !== user.phone) updateUser({ name: contact.name.trim(), phone: contact.phone })
      setReceipt({ coveredIds: coverage.coveredIds, total: created.total, points: earnPoints, code: created.code, discount: created.discount ?? 0, rewardLabel: created.rewardLabel ?? null })
      if (created.discount) setRewards((current) => current.filter((item) => item.id !== reward?.id))
      if (coverage.coveredIds.length > 0) consumeCredits(coverage.coveredIds)
      if (rescheduleId) await cancel(rescheduleId).catch(() => undefined)
      setConfirmed(true)
      window.scrollTo({ top: 0 })
    } catch (caught) {
      const message = caught instanceof ApiError ? (caught.issues[0]?.message ?? caught.message) : 'Não deu para agendar agora. Tente de novo.'
      setError(message)
      // Horário pode ter sido tomado: mostra a grade atualizada.
      slotsQuery.reload()
    } finally {
      setLoading(false)
    }
  }

  if (confirmed && time && receipt) {
    return (
      <section className={styles.done}>
        <div className={styles.doneCard} role="status">
          <span className={styles.doneIcon} aria-hidden="true">
            <CheckIcon />
          </span>
          <p className={styles.doneEyebrow}>Tudo certo</p>
          <h1 className={styles.doneTitle}>
            {rescheduleId ? 'Reagendado.' : 'Agendamento confirmado.'}
          </h1>
          <p className={styles.doneText}>
            <strong>{formatLongDate(day.date)}</strong> às <strong>{time}</strong> com{' '}
            {barber.name}.
          </p>
          {isLoyaltyEnabled() && (
            <p className={styles.earn}>
              <SparklesIcon />
              Ao concluir: <strong>+{receipt.points} pontos</strong> e <strong>+1 selo</strong> no cartão fidelidade.
            </p>
          )}
          <p className={styles.code}>
            Código da reserva: <strong>{receipt.code}</strong>. Você acompanha em Agendamentos.
          </p>
          <ul className={styles.doneList}>
            {chosen.map((service) => (
              <li key={service.id}>
                <span>{service.name}</span>
                <span className={styles.doneMuted}>{formatDuration(service.durationMin)}</span>
                <span>
                  {receipt.coveredIds.includes(service.id) ? 'Incluso' : formatPrice(service.price)}
                </span>
              </li>
            ))}
            {receipt.discount > 0 && (
              <li>
                <span>{receipt.rewardLabel ?? 'Recompensa de indicação'}</span>
                <span className={styles.doneMuted}>Indicação</span>
                <span>−{formatPrice(receipt.discount)}</span>
              </li>
            )}
            <li className={styles.doneTotal}>
              <span>{receipt.total === 0 && fullPrice > 0 ? 'Total (coberto pelo plano)' : 'Total'}</span>
              <span className={styles.doneMuted}>{formatDuration(totalMinutes)}</span>
              <span>{formatPrice(receipt.total)}</span>
            </li>
          </ul>
          <div className={styles.doneActions}>
            <Button size="lg" block to="/agendamentos">
              Ver meus agendamentos
            </Button>
            <Button size="lg" block variant="ghost" to="/home">
              Voltar ao início
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className={styles.booking}>
      <div className={styles.hero}>
        <Photo src={barber.image} alt="" className={styles.photo}>
          <div className={styles.heroBar}>
            <button type="button" className={styles.heroButton} onClick={back} aria-label="Voltar">
              <ArrowLeftIcon />
            </button>
            <button
              type="button"
              className={[styles.heroButton, favorite && styles.heroButtonOn].filter(Boolean).join(' ')}
              onClick={() => setFavorite((state) => !state)}
              aria-pressed={favorite}
              aria-label={favorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            >
              <HeartIcon filled={favorite} />
            </button>
          </div>

          {/* No desktop o nome mora sobre a foto. */}
          <div className={styles.heroInfo}>
            {barber.tier && <span className={styles.badge}>{tierLabel[barber.tier]}</span>}
            <h1 className={styles.name}>{barber.name}</h1>
            <p className={styles.meta}>
              <StarIcon className={styles.star} />
              <span>{formatRating(barber.rating)}</span>
              <span className={styles.muted}>({barber.reviews} avaliações)</span>
            </p>
            <p className={styles.metaSpecialties}>
              <ScissorsIcon className={styles.metaIcon} />
              {barber.specialties.join(' · ')}
            </p>
          </div>
        </Photo>
      </div>

      <div className={styles.sheet}>
        {/* No celular o nome fica no sheet, como no mockup. */}
        <div className={styles.sheetInfo}>
          {barber.tier && <span className={styles.badge}>{tierLabel[barber.tier]}</span>}
          <h1 className={styles.name}>{barber.name}</h1>
          <p className={styles.meta}>
            <StarIcon className={styles.star} />
            <span>{formatRating(barber.rating)}</span>
            <span className={styles.muted}>({barber.reviews} avaliações)</span>
          </p>
          <p className={styles.metaSpecialties}>
            <ScissorsIcon className={styles.metaIcon} />
            {barber.specialties.join(' · ')}
          </p>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Escolha o dia</h2>
          <DayPicker days={days} selected={dayKey} onSelect={selectDay} />
        </section>

        <section className={`${styles.section} ${styles.card}`}>
          <h2 className={styles.sectionTitle}>Escolha o horário</h2>
          <SlotGrid slots={slots} selected={time} onSelect={setChosenTime} loading={slotsQuery.loading && !slotsQuery.data} notice={slotsNotice} />
        </section>

        <section className={`${styles.section} ${styles.card}`}>
          <h2 className={styles.sectionTitle}>Serviços</h2>
          <ServiceList
            services={barber.services}
            selected={selectedServices}
            onToggle={toggleService}
            coveredIds={coverage.coveredIds}
          />
        </section>

        {rewards.length > 0 && (
          <section className={`${styles.section} ${styles.card}`}>
            <h2 className={styles.sectionTitle}>Usar recompensa</h2>
            <p className={styles.sectionHint}>Você ganhou por indicação. Uma por agendamento.</p>
            <div className={styles.rewards} role="radiogroup" aria-label="Recompensas">
              {rewards.map((item) => {
                const active = item.id === rewardId
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`${styles.reward} ${active ? styles.rewardActive : ''}`}
                    onClick={() => setRewardId(active ? null : item.id)}
                  >
                    <GiftIcon className={styles.rewardIcon} />
                    <span className={styles.rewardText}>
                      <span className={styles.rewardLabel}>{item.label}</span>
                      {item.expiresAt && <span className={styles.rewardMeta}>Até {new Date(item.expiresAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>}
                    </span>
                    {active && <CheckIcon className={styles.rewardCheck} />}
                  </button>
                )
              })}
            </div>
            {reward && rewardCheck && (
              <p className={rewardCheck.error || chosen.length === 0 ? styles.rewardWarn : styles.rewardOk}>
                {chosen.length === 0 ? 'Escolha o serviço para ver o desconto.' : (rewardCheck.error ?? `−${formatPrice(discount)} neste agendamento.`)}
              </p>
            )}
          </section>
        )}

        <section className={`${styles.section} ${styles.card}`}>
          <h2 className={styles.sectionTitle}>Seus dados</h2>
          <p className={styles.sectionHint}>A barbearia avisa por WhatsApp.</p>
          <div className={styles.contact}>
            <TextField label="Nome" value={contact.name} onChange={(name) => setContact((state) => ({ ...state, name }))} autoComplete="name" />
            <TextField label="WhatsApp" value={contact.phone} onChange={(phone) => setContact((state) => ({ ...state, phone }))} inputMode="tel" autoComplete="tel" placeholder="(11) 98765-4321" />
          </div>
        </section>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <SummaryBar
          dayLabel={`${day.isToday ? 'Hoje' : day.weekday} ${day.dayNumber}`}
          time={time}
          serviceCount={chosen.length}
          totalMinutes={totalMinutes}
          total={total}
          coveredCount={coverage.coveredIds.length}
          points={isLoyaltyEnabled() ? earnPoints : null}
          loading={loading}
          onConfirm={confirm}
        />
      </div>
    </div>
  )
}
