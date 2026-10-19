import { useState } from 'react'
import { CarIcon, CheckIcon, CopyIcon, MapIcon, NavigationIcon } from '../../components/icons/Icons'
import { fullAddress, routeLinks } from '../../data/shop'
import { detectPlatform } from '../../pwa/useInstall'
import styles from './RouteButtons.module.css'

type RouteButtonsProps = {
  compact?: boolean
}

/** Botões que abrem a rota no app de mapas. Apple Maps só em aparelhos Apple. */
export function RouteButtons({ compact = false }: RouteButtonsProps) {
  const [copied, setCopied] = useState(false)
  const isApple = detectPlatform() === 'ios' || /Mac/.test(navigator.platform)
  const links = routeLinks()

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(fullAddress())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // clipboard bloqueado: o endereço está visível na tela de qualquer jeito
    }
  }

  const items = [
    { href: links.waze, label: 'Waze', icon: NavigationIcon, primary: true },
    { href: links.googleMaps, label: 'Google Maps', icon: MapIcon, primary: true },
    ...(isApple ? [{ href: links.appleMaps, label: 'Apple Maps', icon: MapIcon, primary: false }] : []),
    { href: links.uber, label: 'Uber', icon: CarIcon, primary: false },
  ]

  return (
    <div className={[styles.row, compact && styles.compact].filter(Boolean).join(' ')}>
      {items.map(({ href, label, icon: Icon, primary }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={[styles.button, primary && styles.primary].filter(Boolean).join(' ')}
        >
          <Icon />
          {label}
        </a>
      ))}
      {!compact && (
        <button type="button" className={styles.button} onClick={copyAddress}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copiado' : 'Copiar endereço'}
        </button>
      )}
    </div>
  )
}
