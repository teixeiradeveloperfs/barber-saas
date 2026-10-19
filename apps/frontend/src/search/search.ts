import { getServices, type Service } from '../data/barbers'
import { getBarbers, type Barber } from '../data/home'
import { normalize } from '../lib/text'

export type SearchResults = {
  barbers: Barber[]
  services: Service[]
}

export const quickSearches = ['Degradê', 'Barba', 'Corte + barba', 'Sobrancelha']

function score(query: string, primary: string, secondary: string[] = []) {
  const q = normalize(query)
  const main = normalize(primary)
  if (main.startsWith(q)) return 3
  if (main.includes(q)) return 2
  if (secondary.some((text) => normalize(text).includes(q))) return 1
  return 0
}

/** Busca barbeiros e serviços. Nome vale mais que descrição ou especialidade. */
export function searchAll(query: string, limit = 4): SearchResults {
  const q = normalize(query)
  if (!q) return { barbers: [], services: [] }

  const rankedBarbers = getBarbers()
    .map((barber) => ({ barber, score: score(q, barber.name, barber.specialties) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.barber.rating - a.barber.rating)
    .slice(0, limit)
    .map((item) => item.barber)

  const rankedServices = getServices()
    .map((service) => ({ service, score: score(q, service.name, [service.description, service.category]) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(Boolean(b.service.popular)) - Number(Boolean(a.service.popular)))
    .slice(0, limit)
    .map((item) => item.service)

  return { barbers: rankedBarbers, services: rankedServices }
}
