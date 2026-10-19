import type { SVGProps } from 'react'

type BaseProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & { accent?: string; title?: string }

export function LogoMark({ size = 32, accent = 'var(--accent)', title, ...props }: BaseProps & { size?: number | string }) {
  return <svg viewBox="0 0 64 64" width={size} height={size} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} {...props}><circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="5" /><path d="M22 20l20 24M42 20L22 44" stroke={accent} strokeWidth="5" strokeLinecap="round" /><circle cx="22" cy="20" r="5" fill="currentColor" /><circle cx="42" cy="20" r="5" fill="currentColor" /></svg>
}

export function LogoWordmark({ accent = 'var(--accent)', title, ...props }: BaseProps) { return <Logo accent={accent} title={title} {...props} /> }

export function Logo({ accent = 'var(--accent)', title = 'Sua Barbearia — sua barbearia', ...props }: BaseProps) {
  return <svg viewBox="0 0 360 72" role="img" aria-label={title} {...props}><LogoMark x="0" y="4" size={64} accent={accent} aria-hidden="true" /><text x="80" y="32" fill="currentColor" fontFamily="inherit" fontSize="22" fontWeight="800">Sua Barbearia</text><text x="81" y="53" fill={accent} fontFamily="inherit" fontSize="11" letterSpacing="2">SUA BARBEARIA</text></svg>
}
