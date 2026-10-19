import { useEffect, type RefObject } from 'react'

/** Diferença abaixo disso é barra do navegador ou zoom, não teclado. */
const MIN_KEYBOARD = 120

/**
 * Formulário com teclado aberto no celular. No iOS o teclado não encolhe a
 * página: expõe a altura dele em `--keyboard-inset` (o layout usa como folga
 * embaixo) e, se couber, rola até o botão de enviar ficar acima do teclado
 * junto com o campo em foco. No Android (`interactive-widget=resizes-content`)
 * a página já encolhe e a folga fica em zero.
 */
export function useKeyboardInset(container: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement
    let frame = 0

    const revealSubmit = () => {
      const active = document.activeElement
      const box = container.current
      if (!box || !(active instanceof HTMLElement) || !box.contains(active)) return
      if (!active.matches('input, textarea, select')) return
      const submit = active.closest('form')?.querySelector<HTMLElement>('[type="submit"]')
      if (!submit) return
      const visibleBottom = viewport.offsetTop + viewport.height - 12
      const submitBottom = submit.getBoundingClientRect().bottom
      const fieldTop = active.getBoundingClientRect().top
      const overflow = submitBottom - visibleBottom
      // Só rola se o campo em foco continuar visível no topo.
      if (overflow > 0 && fieldTop - overflow >= viewport.offsetTop + 8) {
        window.scrollBy({ top: overflow, behavior: 'smooth' })
      }
    }

    const update = () => {
      const keyboard = Math.round(window.innerHeight - viewport.height)
      root.style.setProperty('--keyboard-inset', `${keyboard >= MIN_KEYBOARD ? keyboard : 0}px`)
      cancelAnimationFrame(frame)
      if (keyboard >= MIN_KEYBOARD || window.innerHeight < screen.height * 0.7) {
        frame = requestAnimationFrame(revealSubmit)
      }
    }

    update()
    viewport.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener('resize', update)
      root.style.removeProperty('--keyboard-inset')
    }
  }, [container])
}
