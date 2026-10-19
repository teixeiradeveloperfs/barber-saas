import { useEffect } from 'react'

/** Marca `[data-reveal]` com `.in` quando entra na tela. Uma vez só, nada de re-animar. */
export function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!('IntersectionObserver' in window)) {
      for (const node of nodes) node.classList.add('in')
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('in')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    )
    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [])
}

/** Atraso em passos para escalonar irmãos: `style={stagger(i)}`. */
export function stagger(index: number) {
  return { '--i': index } as React.CSSProperties
}
