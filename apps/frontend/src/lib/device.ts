/**
 * Foco automático só com mouse/trackpad. No celular ele abre o teclado assim
 * que a tela aparece e cobre o botão antes de a pessoa ler a tela.
 */
export function canAutoFocus() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
}
