import type { MediaAsset } from '../api/admin'

/** Tipos que a API aceita no upload. */
export const MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml'

/** Logos e ícones costumam ter fundo transparente: mostrar inteiros, sem cortar. */
export function fitsContained(asset: MediaAsset) {
  return asset.mime === 'image/svg+xml' || asset.mime === 'image/png'
}

/** Link http(s) ou caminho do app começando com `/`. */
export function isImageUrl(value: string) {
  return /^https?:\/\/\S+$/i.test(value) || /^\/\S*$/.test(value)
}
