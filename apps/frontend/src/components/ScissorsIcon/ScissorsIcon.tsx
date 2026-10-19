import type { SVGProps } from 'react'

/**
 * Tesoura em traço único. Anéis à esquerda, lâminas abertas apontando para a
 * direita. Herda `currentColor`, então a cor vem de quem usa.
 */
export function ScissorsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="5.5" cy="7" r="3" />
      <circle cx="5.5" cy="17" r="3" />
      <path d="M7.8 8.7 12 12" />
      <path d="M21.5 5 7.8 15.3" />
      <path d="M14.4 13.9 21.5 19" />
    </svg>
  )
}
