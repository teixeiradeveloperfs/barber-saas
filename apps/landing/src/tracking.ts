import { captureUtm, sessionId } from './utm'

/**
 * Meta Pixel e Google tag, ligados só quando o painel define os IDs.
 * PageView/page_view saem no carregamento; `track()` marca os cliques que importam.
 */

type TrackingIds = {
  metaPixelId: string | null
  googleTagId: string | null
  googleAdsConversion: string | null
}

type Gtag = (...args: unknown[]) => void

const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '')
const VISIT_FLAG = 'barberos:lp:visita'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

const loaded: { meta: string | null; google: string | null } = { meta: null, google: null }
let adsConversion: string | null = null

export function initTracking(ids: TrackingIds) {
  adsConversion = ids.googleAdsConversion
  const pixel = ids.metaPixelId?.replace(/\D/g, '') ?? ''
  if (pixel && loaded.meta !== pixel) {
    loadMetaPixel(pixel)
    loaded.meta = pixel
  }
  const tag = ids.googleTagId?.trim() ?? ''
  if (tag && /^[A-Z]{1,2}-[A-Z0-9-]+$/i.test(tag) && loaded.google !== tag) {
    loadGoogleTag(tag)
    loaded.google = tag
  }
}

function loadMetaPixel(id: string) {
  const script = document.createElement('script')
  // Snippet oficial do Pixel; o id só tem dígitos (validado no painel e aqui).
  script.textContent =
    "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');" +
    `fbq('init','${id}');fbq('track','PageView');`
  document.head.appendChild(script)
}

function loadGoogleTag(id: string) {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(script)
  window.dataLayer = window.dataLayer ?? []
  if (!window.gtag) {
    // O gtag.js lê o objeto `arguments` do dataLayer; um array no lugar não funciona.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments)
    }
  }
  window.gtag('js', new Date())
  window.gtag('config', id)
}

type EventKind = 'VISITA' | 'CONTATO' | 'DEMO'

/** Rastreio próprio (com UTM e referrer) na API da plataforma; some em silêncio se ela não responder. */
export function recordEvent(kind: EventKind) {
  if (!API_URL) return
  const utm = captureUtm()
  const body = JSON.stringify({
    kind,
    sessionId: sessionId(),
    utmSource: utm.utm_source,
    utmMedium: utm.utm_medium,
    utmCampaign: utm.utm_campaign,
    utmTerm: utm.utm_term,
    utmContent: utm.utm_content,
    referrer: document.referrer.slice(0, 300) || undefined,
    path: window.location.pathname.slice(0, 200),
  })
  // keepalive: o clique no WhatsApp abre outra aba e a request precisa sobreviver.
  fetch(`${API_URL}/platform/landing/events`, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {})
}

/** Uma visita por sessão do navegador; a API ainda deduplica por 24 h. */
export function recordVisit() {
  try {
    if (sessionStorage.getItem(VISIT_FLAG)) return
    sessionStorage.setItem(VISIT_FLAG, '1')
  } catch {
    // sem storage, conta a visita mesmo assim
  }
  recordEvent('VISITA')
}

/** Eventos que importam para a venda: clique no WhatsApp e abrir o app de exemplo. */
export function track(event: 'contact' | 'demo') {
  recordEvent(event === 'contact' ? 'CONTATO' : 'DEMO')
  if (event === 'contact') {
    window.fbq?.('track', 'Contact')
    window.gtag?.('event', 'contact', { method: 'whatsapp' })
    if (adsConversion && loaded.google) {
      const sendTo = adsConversion.includes('/') ? adsConversion : `${loaded.google}/${adsConversion}`
      window.gtag?.('event', 'conversion', { send_to: sendTo })
    }
    return
  }
  window.fbq?.('trackCustom', 'VerAppExemplo')
  window.gtag?.('event', 'view_demo')
}

/** Abriu o checkout (uma vez por carregamento). */
export function trackCheckoutStart(valueCents: number) {
  window.fbq?.('track', 'InitiateCheckout', { value: valueCents / 100, currency: 'BRL' })
  window.gtag?.('event', 'begin_checkout', { value: valueCents / 100, currency: 'BRL' })
}

/** Compra confirmada no checkout: conversão do Pixel, do GA e do Google Ads. */
export function trackPurchase(valueCents: number, transactionId: string) {
  const value = valueCents / 100
  window.fbq?.('track', 'Purchase', { value, currency: 'BRL' }, { eventID: transactionId })
  window.fbq?.('track', 'Subscribe', { value, currency: 'BRL', predicted_ltv: value * 12 })
  window.gtag?.('event', 'purchase', { transaction_id: transactionId, value, currency: 'BRL', items: [{ item_name: 'Sua Barbearia', price: value, quantity: 1 }] })
  if (adsConversion && loaded.google) {
    const sendTo = adsConversion.includes('/') ? adsConversion : `${loaded.google}/${adsConversion}`
    window.gtag?.('event', 'conversion', { send_to: sendTo, value, currency: 'BRL', transaction_id: transactionId })
  }
}
