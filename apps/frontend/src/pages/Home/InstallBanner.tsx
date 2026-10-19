import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button/Button'
import { DownloadIcon } from '../../components/icons/Icons'
import { useInstall } from '../../pwa/useInstall'
import { useTenant } from '../../tenant/useTenant'
import styles from './InstallBanner.module.css'

const STORAGE_KEY = 'luxe-cuts:install-banner-dismissed'

function readDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Convite discreto para instalar. Some no app instalado ou depois de dispensado. */
export function InstallBanner() {
  const { installed, canPrompt, install } = useInstall()
  const { name, features } = useTenant()
  const [dismissed, setDismissed] = useState(readDismissed)
  const [busy, setBusy] = useState(false)

  if (!features.pwa || !features.installBanner || installed || dismissed) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // sem storage, some só nesta sessão
    }
  }

  async function handleInstall() {
    setBusy(true)
    await install()
    setBusy(false)
  }

  return (
    <aside className={styles.banner} aria-label="Instalar o app">
      <span className={styles.icon} aria-hidden="true">
        <DownloadIcon />
      </span>
      <div className={styles.text}>
        <span className={styles.title}>Instale a {name} na tela inicial</span>
        <span className={styles.hint}>Abre em tela cheia, sem passar pela loja.</span>
      </div>
      <div className={styles.actions}>
        {canPrompt ? (
          <Button size="sm" onClick={handleInstall} loading={busy}>
            Instalar
          </Button>
        ) : (
          <Button size="sm" to="/instalar">
            Ver como
          </Button>
        )}
        <button type="button" className={styles.dismiss} onClick={dismiss}>
          Agora não
        </button>
      </div>
      <Link to="/instalar" className={styles.overlayLink} aria-hidden="true" tabIndex={-1} />
    </aside>
  )
}
