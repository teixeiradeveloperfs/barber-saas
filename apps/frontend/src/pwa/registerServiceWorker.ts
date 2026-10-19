/** Registra o service worker só em produção. Em dev atrapalha o HMR. */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // sem SW o app segue funcionando, só perde offline e instalação
    })
  })
}
