import { useEffect, useState, type FormEvent } from 'react'
import { maskPhone, reais } from '../checkout/masks'
import { Pole } from '../sections/Pole'
import { useLinks, usePlan } from '../settings-context'
import { CheckIcon } from '../ui/Icons'
import { LogoMark } from '../ui/Logo'
import styles from './PartnersPage.module.css'
import { usePartnerTerms } from './terms'

const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '')

const MAX_SHOPS = 30

/** Página "Seja parceiro": quem indica o Sua Barbearia ganha comissão das mensalidades. */
export function PartnersPage() {
  const plan = usePlan()
  const links = useLinks()
  const terms = usePartnerTerms()
  const [shops, setShops] = useState(5)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Seja parceiro do Sua Barbearia'
  }, [])

  // Quem entra depois da inauguração paga o preço cheio: a conta usa ele.
  const perShop = terms.kind === 'FIXO' ? terms.value : Math.round((plan.priceCents * terms.value) / 100)
  const monthly = perShop * shops
  const yearly = monthly * (terms.months > 0 ? Math.min(12, terms.months) : 12)
  const share = terms.kind === 'FIXO' ? reais(terms.value) : `${terms.value}%`

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (form.name.trim().length < 3) next.name = 'Informe seu nome.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'E-mail inválido.'
    if (form.phone.replace(/\D/g, '').length < 10) next.phone = 'WhatsApp com DDD.'
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length > 0) return
    if (!API_URL) {
      setFormError('Cadastro indisponível agora. Fale com a gente no WhatsApp.')
      return
    }
    setBusy(true)
    try {
      const response = await fetch(`${API_URL}/platform/affiliates`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, ...(honeypot ? { website: honeypot } : {}) }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string; issues?: { path: string; message: string }[] } | null
        if (data?.issues?.length) setErrors(Object.fromEntries(data.issues.map((issue) => [issue.path, issue.message])))
        setFormError(data?.message && !data.issues?.length ? data.message : 'Confira os campos e tente de novo.')
        return
      }
      setSentTo(form.email.trim())
    } catch {
      setFormError('Sem conexão. Confira a internet e tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  const field = (key: keyof typeof form, label: string, props: Record<string, unknown> = {}, mask?: (v: string) => string) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input value={form[key]} onChange={(event) => setForm({ ...form, [key]: mask ? mask(event.target.value) : event.target.value })} aria-invalid={errors[key] ? true : undefined} {...props} />
      {errors[key] && <em>{errors[key]}</em>}
    </label>
  )

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <a href="/" className={styles.brand} aria-label="Sua Barbearia, voltar ao site">
          <LogoMark size={28} />
          <span>
            Barber<b>OS</b>
          </span>
        </a>
        <a className="btn btnGhost btnSm" href={links.admin}>
          Já sou parceiro
        </a>
      </header>

      <main className={styles.layout}>
        <section className={styles.pitch}>
          <p className="eyebrow">Programa de parceiros</p>
          <h1 className={styles.title}>
            Indique barbearias. Receba <em>todo mês</em>.
          </h1>
          <p className="lead">
            Conhece donos de barbearia? Cada um que assinar o Sua Barbearia pelo seu link rende {share} da mensalidade para você,{' '}
            {terms.months > 0 ? `nas ${terms.months} primeiras mensalidades` : 'enquanto ele for assinante'}. Sem custo e sem meta.
          </p>

          <div className={styles.calc} aria-label="Simulação de ganhos">
            <div className={styles.calcHead}>
              <label htmlFor="barbearias" className={styles.calcLabel}>
                Barbearias indicadas
              </label>
              <output htmlFor="barbearias" className={styles.calcCount}>
                {shops}
              </output>
            </div>
            <div className={styles.track}>
              <Pole direction="horizontal" className={styles.fill} />
              <span className={styles.fillMask} style={{ left: `${((shops - 1) / (MAX_SHOPS - 1)) * 100}%` }} aria-hidden="true" />
              <input id="barbearias" type="range" min={1} max={MAX_SHOPS} value={shops} onChange={(event) => setShops(Number(event.target.value))} className={styles.range} />
            </div>
            <div className={styles.calcResult}>
              <span>
                <strong className={styles.money}>{reais(monthly)}</strong> por mês
              </span>
              <span className={styles.calcYear}>
                {reais(yearly)} em {terms.months > 0 && terms.months < 12 ? `${terms.months} meses` : '12 meses'}
              </span>
            </div>
            <p className={styles.calcNote}>Estimativa com a mensalidade de {reais(plan.priceCents)}. Você recebe sobre o que a barbearia de fato pagar.</p>
          </div>
        </section>

        <section className={styles.panel} aria-live="polite">
          {sentTo ? (
            <div className={styles.done}>
              <span className={styles.doneIcon}>
                <CheckIcon />
              </span>
              <h2 className={styles.panelTitle}>Confira seu e-mail</h2>
              <p className={styles.note}>
                Mandamos para <strong>{sentTo}</strong> o link para criar sua senha e o seu link de indicação. No painel você acompanha indicações, ganhos e pede saque por Pix.
              </p>
            </div>
          ) : !terms.enabled ? (
            <div className={styles.done}>
              <h2 className={styles.panelTitle}>Inscrições fechadas</h2>
              <p className={styles.note}>O programa não está aceitando parceiros novos agora. Fale com a gente no WhatsApp para entrar na lista.</p>
              <a className="btn btnPrimary" href={links.contact} target="_blank" rel="noreferrer">
                Falar no WhatsApp
              </a>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className={styles.form}>
              <h2 className={styles.panelTitle}>Quero ser parceiro</h2>
              {field('name', 'Nome', { autoComplete: 'name' })}
              {field('email', 'E-mail', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
              {field('phone', 'WhatsApp', { autoComplete: 'tel', inputMode: 'tel', placeholder: '(11) 98765-4321' }, maskPhone)}
              <input className={styles.honeypot} tabIndex={-1} autoComplete="off" aria-hidden="true" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} name="website" />
              {formError && (
                <p className={styles.error} role="alert">
                  {formError}
                </p>
              )}
              <button type="submit" className={`btn btnPrimary ${styles.submit}`} disabled={busy}>
                {busy ? 'Enviando…' : 'Receber meu link'}
              </button>
              <p className={styles.fine}>
                Ao enviar você concorda com os <a href="/termos-parceiros" target="_blank">Termos do Programa de Parceiros</a> e a <a href="/privacidade" target="_blank">Política de Privacidade</a>.
              </p>
              <p className={styles.fine}>Já tem acesso ao painel do Sua Barbearia? Entre nele e abra "Indique e ganhe" no menu.</p>
            </form>
          )}
        </section>

        <section className={styles.steps} aria-label="Como funciona">
          <h2 className={styles.stepsTitle}>Como funciona</h2>
          <ol>
            <li>
              <strong>Pegue seu link</strong>
              <span>O cadastro leva um minuto. O link e o painel chegam por e-mail.</span>
            </li>
            <li>
              <strong>Mande para quem conhece</strong>
              <span>Quem abre o seu link e assina em até 90 dias fica ligado a você.</span>
            </li>
            <li>
              <strong>Receba por Pix</strong>
              <span>
                A comissão libera {terms.holdDays} dias depois de cada pagamento. Saque a partir de {reais(terms.minPayoutCents)}, direto na sua chave.
              </span>
            </li>
          </ol>
          <ul className={styles.facts}>
            <li>
              <CheckIcon />
              Acompanhe no painel cada barbearia, cada mensalidade e cada saque.
            </li>
            <li>
              <CheckIcon />
              Se a barbearia pedir reembolso nos 7 dias de teste, a comissão daquela mensalidade não conta.
            </li>
            <li>
              <CheckIcon />
              Não precisa ser dono de barbearia nem ter CNPJ.
            </li>
          </ul>
        </section>
      </main>
    </div>
  )
}
