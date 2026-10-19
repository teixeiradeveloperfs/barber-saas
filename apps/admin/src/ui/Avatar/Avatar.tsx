import { useState } from 'react'
import styles from './Avatar.module.css'

type AvatarProps = {
  name: string
  src?: string
  size?: number
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ name, src, size = 44 }: AvatarProps) {
  const [broken, setBroken] = useState(false)
  const showImage = Boolean(src) && !broken

  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      role="img"
      aria-label={name}
    >
      {showImage ? (
        <img src={src} alt="" onError={() => setBroken(true)} />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  )
}
