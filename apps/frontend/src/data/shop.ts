import type { OpeningHours } from '@barber/tenant-config'
import { getTenant } from '../tenant/active'

export type { OpeningHours }

/** Dados de local e contato do tenant ativo. */
export function getShop() {
  const tenant = getTenant()
  return {
    name: tenant.name,
    address: tenant.address,
    coords: { lat: tenant.address.lat, lng: tenant.address.lng },
    phone: tenant.contact.phone,
    whatsapp: tenant.contact.whatsapp,
    instagram: tenant.contact.instagram,
    parking: tenant.parking,
    hours: tenant.hours,
  }
}

export function fullAddress() {
  const { address } = getTenant()
  const first = [address.street, address.complement].filter(Boolean).join(', ')
  return `${first} · ${address.district}, ${address.city} - ${address.state}, ${address.zip}`
}

/** Links de rota. Todos abrem o app quando instalado e caem no site quando não. */
export function routeLinks() {
  const { address, name } = getTenant()
  const { lat, lng } = address
  const label = encodeURIComponent(name)
  return {
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    appleMaps: `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d&q=${label}`,
    uber: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${label}`,
  }
}

export function mapEmbedUrl() {
  const { lat, lng } = getTenant().address
  return `https://www.google.com/maps?q=${lat},${lng}&z=16&hl=pt-BR&output=embed`
}

export function whatsappLink() {
  const { contact, name } = getTenant()
  const text = encodeURIComponent(`Olá! Vim pelo app da ${name}.`)
  return `https://wa.me/${contact.whatsapp}?text=${text}`
}

export function instagramLink() {
  const handle = getTenant().contact.instagram
  return handle ? `https://instagram.com/${handle}` : null
}

export const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function minutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Estado de hoje: aberto agora, abre mais tarde ou fechado. */
export function todayStatus(now = new Date()) {
  const today = getTenant().hours.find((item) => item.day === now.getDay())
  if (!today?.open || !today.close) return { open: false, label: 'Fechado hoje' }
  const current = now.getHours() * 60 + now.getMinutes()
  if (current < minutes(today.open)) return { open: false, label: `Abre às ${today.open}` }
  if (current >= minutes(today.close)) return { open: false, label: `Fechou às ${today.close}` }
  return { open: true, label: `Aberto até ${today.close}` }
}
