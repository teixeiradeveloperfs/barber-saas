import { slugify } from '../lib/format'

/** Slug único a partir de um nome, evitando colisão com os já usados. */
export function uniqueSlug(name: string, taken: string[], fallback = 'item') {
  const base = slugify(name) || fallback
  if (!taken.includes(base)) return base
  let counter = 2
  while (taken.includes(`${base}-${counter}`)) counter += 1
  return `${base}-${counter}`
}
