import type { AppConfig, ThemeSide } from '@barber/tenant-config'

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const value = Number.parseInt(full, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const
}

function side(theme: ThemeSide, isLight: boolean) {
  const [r, g, b] = hexToRgb(theme.accent)
  const hi = theme.accentHi ?? `color-mix(in srgb, ${theme.accent}, white 22%)`
  const lo = theme.accentLo ?? `color-mix(in srgb, ${theme.accent}, black 8%)`
  const on = theme.onAccent ?? '#141312'
  return [
    `--accent: ${theme.accent};`,
    `--accent-rgb: ${r}, ${g}, ${b};`,
    `--accent-hi: ${hi};`,
    `--accent-lo: ${lo};`,
    `--on-accent: ${on};`,
    isLight ? '' : `--champagne: ${theme.accent};`,
    isLight ? '' : `--champagne-hi: ${hi};`,
    isLight ? '' : `--champagne-lo: ${lo};`,
  ].join('\n  ')
}

/** CSS que sobrescreve os tokens de acento do index.css com as cores do tenant. */
export function tenantThemeCss(config: AppConfig) {
  const dark = side(config.brand.theme.dark, false)
  const light = side(config.brand.theme.light, true)
  return `
:root, :root[data-theme='dark'] {
  ${dark}
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) {
    ${light}
  }
}
:root[data-theme='light'] {
  ${light}
}
`
}

const STYLE_ID = 'tenant-theme'

export function applyTenantTheme(config: AppConfig) {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = tenantThemeCss(config)
}

/** Hash curto só para furar cache de ícone quando a imagem muda. */
function shortHash(text: string) {
  let hash = 5381
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36)
}

function setMeta(name: string, content: string) {
  const meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (meta) meta.content = content
}

function setLink(rel: string, href: string) {
  const link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!link) return
  // O type do HTML é do favicon padrão (SVG); com outra imagem ele faria o navegador ignorar o ícone.
  link.removeAttribute('type')
  link.href = href
}

/**
 * Nome e ícones da barbearia na aba e no app instalado. O manifest e o
 * apple-touch-icon já vêm da barbearia do host (nginx/API); aqui entram o
 * título do iOS, o favicon da aba e o ?v= que fura cache quando a marca muda.
 */
export function applyTenantDocument(config: AppConfig) {
  document.title = config.name
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (description) description.content = config.copy.splashHeadline
  setMeta('apple-mobile-web-app-title', config.name)
  setMeta('application-name', config.name)

  const logo = config.brand.logo.kind === 'image' ? config.brand.logo.url : undefined
  const source = config.brand.faviconUrl || logo
  if (!source) return
  const version = shortHash(source)
  // Logo retangular não serve de favicon cru: usa o ícone quadrado gerado dele.
  setLink('icon', config.brand.faviconUrl || `/app-icon/icon-192.png?v=${version}`)
  setLink('apple-touch-icon', `/apple-touch-icon.png?v=${version}`)
}
