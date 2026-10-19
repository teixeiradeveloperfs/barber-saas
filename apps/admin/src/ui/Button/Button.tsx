import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './Button.module.css'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type CommonProps = {
  variant?: Variant
  size?: Size
  block?: boolean
  /** Desabilita e mostra um spinner no lugar do conteúdo. */
  loading?: boolean
  className?: string
  children: ReactNode
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined }
type LinkProps = CommonProps & { to: string }

type StyleProps = Omit<CommonProps, 'children'>

function classes({ variant = 'primary', size = 'md', block, loading, className }: StyleProps) {
  return [
    styles.button,
    styles[variant],
    styles[size],
    block && styles.block,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

export function Button(props: ButtonProps | LinkProps) {
  if ('to' in props && props.to !== undefined) {
    const { to, children, ...rest } = props
    return (
      <Link to={to} className={classes(rest)}>
        {children}
      </Link>
    )
  }
  const {
    variant,
    size,
    block,
    loading = false,
    className,
    children,
    type = 'button',
    disabled,
    ...rest
  } = props as ButtonProps
  return (
    <button
      type={type}
      className={classes({ variant, size, block, loading, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className={styles.content}>{children}</span>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </button>
  )
}
