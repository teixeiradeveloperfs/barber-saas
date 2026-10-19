import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLinks, usePlan } from '../settings-context'
import { trackCheckoutStart, trackPurchase } from '../tracking'
import { LogoMark } from '../ui/Logo'
import { CheckIcon } from '../ui/Icons'
import { captureUtm, currentRef } from '../utm'
import { checkoutStatus, CheckoutError, startCheckout, type CheckoutMethod, type CheckoutView } from './api'
import { maskCard, maskCep, maskDocument, maskExpiry, maskPhone, onlyDigits, reais } from './masks'
import styles from './CheckoutPage.module.css'

type Buyer = { name: string; email: string; phone: string; document: string; shopName: string }
type Card = { number: string; holderName: string; expiry: string; ccv: string; postalCode: string; addressNumber: string }

const ORDER_PARAM = 'pedido'
const INCLUDED = ['App com a sua marca e domínio próprio', 'Agenda, equipe e clientes sem limite', 'Lembrete no WhatsApp com confirmação de ida', 'Clube de assinatura e recompensas', 'Suporte e atualizações inclusos']

function orderFromUrl() {
  return new URLSearchParams(window.location.search).get(ORDER_PARAM)
}

function setOrderInUrl(id: string | null) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set(ORDER_PARAM, id)
  else url.searchParams.delete(ORDER_PARAM)
  window.history.replaceState(null, '', url)
}

/** Checkout próprio: dados, Pix Automático ou cartão, e acompanhamento até a barbearia ficar pronta. */
export function CheckoutPage() {
  const plan = usePlan()
  const links = useLinks()
  const price = plan.founder.open ? plan.founder.priceCents : plan.priceCents
  const [method, setMethod] = useState<CheckoutMethod>('PIX_AUTOMATICO')
  const [buyer, setBuyer] = useState<Buyer>({ name: '', email: '', phone: '', document: '', shopName: '' })
  const [card, setCard] = useState<Card>({ number: '', holderName: '', expiry: '', ccv: '', postalCode: '', addressNumber: '' })
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [order, setOrder] = useState<CheckoutView | null>(null)
  const [copied, setCopied] = useState(false)
  const tracked = useRef({ start: false, purchase: false })

  useEffect(() => {
    document.title = 'Assinar o Sua Barbearia'
    if (!tracked.current.start) {
      tracked.current.start = true
      trackCheckoutStart(price)
    }
    const saved = orderFromUrl()
    if (saved) checkoutStatus(saved).then(setOrder).catch(() => setOrderInUrl(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Acompanha até concluir: Pix espera o banco; cartão costuma voltar pronto.
  const waiting = order?.status === 'AGUARDANDO_PAGAMENTO' || order?.status === 'PAGO'
  useEffect(() => {
    if (!order || !waiting) return
    const timer = window.setInterval(() => {
      checkoutStatus(order.id).then(setOrder).catch(() => undefined)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [order, waiting])

  useEffect(() => {
    if (order?.status === 'CONCLUIDO' && !tracked.current.purchase) {
      tracked.current.purchase = true
      trackPurchase(order.priceCents, order.id)
    }
  }, [order])

  function validate() {
    const next: Record<string, string> = {}
    if (buyer.name.trim().split(/\s+/).length < 2) next.name = 'Nome e sobrenome.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim())) next.email = 'E-mail inválido.'
    if (onlyDigits(buyer.phone).length < 10) next.phone = 'WhatsApp com DDD.'
    const doc = onlyDigits(buyer.document)
    if (doc.length !== 11 && doc.length !== 14) next.document = 'CPF (11) ou CNPJ (14 dígitos).'
    if (buyer.shopName.trim().length < 2) next.shopName = 'Nome da barbearia.'
    if (method === 'CARTAO') {
      if (onlyDigits(card.number).length < 13) next.number = 'Número do cartão.'
      if (card.holderName.trim().length < 3) next.holderName = 'Nome como está no cartão.'
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) next.expiry = 'Validade MM/AA.'
      if (!/^\d{3,4}$/.test(card.ccv)) next.ccv = 'CVV.'
      if (onlyDigits(card.postalCode).length !== 8) next.postalCode = 'CEP com 8 dígitos.'
      if (!card.addressNumber.trim()) next.addressNumber = 'Número.'
    }
    return next
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const [month, year] = card.expiry.split('/')
      const utm = captureUtm()
      const result = await startCheckout({
        ...buyer,
        method,
        card: method === 'CARTAO' ? { number: card.number, holderName: card.holderName, expiryMonth: month, expiryYear: year, ccv: card.ccv, postalCode: card.postalCode, addressNumber: card.addressNumber } : undefined,
        utm: Object.keys(utm).length ? (utm as Record<string, string>) : null,
        ref: currentRef(),
        website: honeypot,
      })
      setOrder(result)
      setOrderInUrl(result.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (caught) {
      if (caught instanceof CheckoutError && caught.issues.length) {
        setErrors(Object.fromEntries(caught.issues.map((issue) => [issue.path.replace(/^card\./, ''), issue.message])))
      }
      setFormError(caught instanceof Error ? caught.message : 'Não foi possível continuar.')
    } finally {
      setBusy(false)
    }
  }

  function restart() {
    setOrder(null)
    setOrderInUrl(null)
    setFormError(null)
  }

  async function copyPix() {
    if (!order?.pix) return
    await navigator.clipboard?.writeText(order.pix.payload).catch(() => undefined)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2500)
  }

  const field = (key: keyof Buyer, label: string, props: Record<string, unknown> = {}, mask?: (v: string) => string) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input value={buyer[key]} onChange={(event) => setBuyer({ ...buyer, [key]: mask ? mask(event.target.value) : event.target.value })} aria-invalid={errors[key] ? true : undefined} {...props} />
      {errors[key] && <em>{errors[key]}</em>}
    </label>
  )
  const cardField = (key: keyof Card, label: string, props: Record<string, unknown> = {}, mask?: (v: string) => string) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input value={card[key]} onChange={(event) => setCard({ ...card, [key]: mask ? mask(event.target.value) : event.target.value })} aria-invalid={errors[key] ? true : undefined} {...props} />
      {errors[key] && <em>{errors[key]}</em>}
    </label>
  )

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <a href="/" className={styles.brand} aria-label="Sua Barbearia, voltar ao site">
          <LogoMark size={28} />
          <span>
            Sua <b>Barbearia</b>
          </span>
        </a>
        <span className={styles.secure}>Pagamento seguro pelo Asaas</span>
      </header>

      <main className={order ? `${styles.layout} ${styles.ordered}` : styles.layout}>
        <aside className={styles.summary}>
          <p className={styles.eyebrow}>Sua assinatura</p>
          <h1 className={styles.plan}>{plan.name}</h1>
          <p className={styles.price}>
            <strong>{reais(price)}</strong> por mês
          </p>
          {plan.founder.open && <p className={styles.founder}>Sócio fundador: este valor fica travado para sempre.</p>}
          <ul className={styles.included}>
            {INCLUDED.map((item) => (
              <li key={item}>
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>
          <p className={styles.guarantee}>
            <strong>7 dias de teste.</strong> Se não gostar, cancele no painel em até 7 dias depois da compra e devolvemos 100%, a qualquer momento dentro desse prazo.
          </p>
          <p className={styles.fine}>Sem fidelidade. Depois dos 7 dias, cancele quando quiser: não há novas cobranças.</p>
        </aside>

        <section className={styles.panel} aria-live="polite">
          {!order && (
            <form onSubmit={submit} noValidate className={styles.form}>
              <h2 className={styles.title}>Seus dados</h2>
              <div className={styles.grid}>
                {field('name', 'Nome completo', { autoComplete: 'name' })}
                {field('email', 'E-mail', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
                {field('phone', 'WhatsApp', { autoComplete: 'tel', inputMode: 'tel', placeholder: '(11) 98765-4321' }, maskPhone)}
                {field('document', 'CPF ou CNPJ', { inputMode: 'numeric' }, maskDocument)}
              </div>
              {field('shopName', 'Nome da barbearia', { placeholder: 'Ex.: Barbearia do Zé' })}
              <input className={styles.honeypot} tabIndex={-1} autoComplete="off" aria-hidden="true" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} name="website" />

              <h2 className={styles.title}>Pagamento</h2>
              <div className={styles.methods} role="radiogroup" aria-label="Forma de pagamento">
                <button type="button" role="radio" aria-checked={method === 'PIX_AUTOMATICO'} className={method === 'PIX_AUTOMATICO' ? styles.methodOn : styles.method} onClick={() => setMethod('PIX_AUTOMATICO')}>
                  <strong>Pix Automático</strong>
                  <span>Autoriza uma vez no banco, paga sozinho todo mês</span>
                </button>
                <button type="button" role="radio" aria-checked={method === 'CARTAO'} className={method === 'CARTAO' ? styles.methodOn : styles.method} onClick={() => setMethod('CARTAO')}>
                  <strong>Cartão de crédito</strong>
                  <span>Cobrança mensal no cartão</span>
                </button>
              </div>

              {method === 'PIX_AUTOMATICO' ? (
                <p className={styles.note}>Na próxima tela aparece um QR. Você paga a primeira mensalidade e autoriza as próximas no app do seu banco. Dá para cancelar pelo próprio banco quando quiser.</p>
              ) : (
                <div className={styles.grid}>
                  {cardField('number', 'Número do cartão', { inputMode: 'numeric', autoComplete: 'cc-number' }, maskCard)}
                  {cardField('holderName', 'Nome no cartão', { autoComplete: 'cc-name' })}
                  {cardField('expiry', 'Validade', { inputMode: 'numeric', autoComplete: 'cc-exp', placeholder: 'MM/AA' }, maskExpiry)}
                  {cardField('ccv', 'CVV', { inputMode: 'numeric', autoComplete: 'cc-csc' }, (v) => onlyDigits(v).slice(0, 4))}
                  {cardField('postalCode', 'CEP do titular', { inputMode: 'numeric', autoComplete: 'postal-code' }, maskCep)}
                  {cardField('addressNumber', 'Número do endereço', { inputMode: 'numeric' })}
                </div>
              )}

              {formError && (
                <p className={styles.error} role="alert">
                  {formError}
                </p>
              )}
              <button type="submit" className={`btn btnPrimary ${styles.submit}`} disabled={busy}>
                {busy ? 'Processando…' : method === 'PIX_AUTOMATICO' ? `Gerar Pix Automático de ${reais(price)}` : `Assinar por ${reais(price)}/mês`}
              </button>
              <p className={styles.fine}>
                Ao assinar você concorda com os <a href="/termos" target="_blank">Termos de Uso</a> e a <a href="/privacidade" target="_blank">Política de Privacidade</a>, e com a cobrança mensal de {reais(price)} até cancelar, com 7 dias para pedir reembolso integral. Dúvidas?{' '}
                <a href={links.contact} target="_blank" rel="noreferrer">
                  Fale com a gente no WhatsApp
                </a>
                .
              </p>
            </form>
          )}

          {order && waiting && order.pix && (
            <div className={styles.pix}>
              <h2 className={styles.title}>Pague com Pix Automático</h2>
              <p className={styles.note}>Abra o app do seu banco, escolha pagar com Pix e leia o QR. O banco pede para autorizar as próximas mensalidades: confirme. A página atualiza sozinha.</p>
              {order.pix.image && <img className={styles.qr} src={`data:image/png;base64,${order.pix.image}`} alt="QR do Pix Automático" />}
              <button type="button" className="btn btnGhost" onClick={copyPix}>
                {copied ? 'Código copiado' : 'Copiar código Pix'}
              </button>
              <p className={styles.waiting}>
                <span className={styles.dot} aria-hidden="true" />
                Esperando o pagamento…
              </p>
            </div>
          )}

          {order && waiting && !order.pix && (
            <div className={styles.pix}>
              <h2 className={styles.title}>Confirmando o pagamento</h2>
              <p className={styles.waiting}>
                <span className={styles.dot} aria-hidden="true" />
                {order.status === 'PAGO' ? 'Pagamento aprovado. Criando a sua barbearia…' : 'Esperando a confirmação do cartão…'}
              </p>
            </div>
          )}

          {order?.status === 'CONCLUIDO' && (
            <div className={styles.done}>
              <span className={styles.doneIcon}>
                <CheckIcon />
              </span>
              <h2 className={styles.title}>Pagamento confirmado!</h2>
              <p className={styles.note}>
                A <strong>{order.shopName}</strong> já está no Sua Barbearia. Mandamos para <strong>{order.email}</strong> o link para criar a sua senha. Depois são 6 passos rápidos para deixar o app com a sua cara.
              </p>
              {order.accessLink && (
                <a className={`btn btnPrimary ${styles.submit}`} href={order.accessLink}>
                  Criar minha senha agora
                </a>
              )}
            </div>
          )}

          {order && (order.status === 'FALHOU' || order.status === 'EXPIRADO') && (
            <div className={styles.pix}>
              <h2 className={styles.title}>{order.status === 'EXPIRADO' ? 'O Pix expirou' : 'Pagamento não concluído'}</h2>
              <p className={styles.error}>{order.error ?? 'Tente de novo.'}</p>
              <button type="button" className={`btn btnPrimary ${styles.submit}`} onClick={restart}>
                Tentar de novo
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
