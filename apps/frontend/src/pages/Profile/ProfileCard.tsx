import { useRef, useState } from 'react'
import { Avatar } from '../../components/Avatar/Avatar'
import { Button } from '../../components/Button/Button'
import { CameraIcon } from '../../components/icons/Icons'
import { formatMonthYear } from '../../lib/format'
import { resizeImageFile } from '../../lib/image'
import { useUser } from '../../user/useUser'
import styles from './profile.module.css'

export function ProfileCard() {
  const { user, updateUser } = useUser()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Escolha um arquivo de imagem.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const dataUrl = await resizeImageFile(file)
      updateUser({ avatar: dataUrl })
    } catch {
      setError('Não deu para ler essa imagem. Tente outra.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <aside className={styles.profileCard}>
      <div className={styles.avatarWrap}>
        <Avatar name={user.name} src={user.avatar} size={96} />
        <button
          type="button"
          className={styles.avatarButton}
          onClick={() => fileRef.current?.click()}
          aria-label="Trocar foto"
          title="Trocar foto"
          disabled={busy}
        >
          <CameraIcon />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      <div className={styles.identity}>
        <h2 className={styles.userName}>{user.name}</h2>
        <p className={styles.userEmail}>{user.email}</p>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <dl className={styles.stats}>
        <div>
          <dt>Atendimentos</dt>
          <dd>{user.appointments}</dd>
        </div>
        <div>
          <dt>Cliente desde</dt>
          <dd>{formatMonthYear(user.memberSince)}</dd>
        </div>
      </dl>

      <Button variant="ghost" block onClick={() => fileRef.current?.click()} loading={busy}>
        <CameraIcon />
        Trocar foto
      </Button>
    </aside>
  )
}
