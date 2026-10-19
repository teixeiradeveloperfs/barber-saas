import { Button } from '../ui/Button/Button'

export function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', padding: '48px 0' }}>
      <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.02em' }}>Página não encontrada</h1>
      <p style={{ margin: 0, color: 'var(--text-3)' }}>O endereço não existe ou foi movido.</p>
      <Button to="/barbearias" variant="ghost">
        Voltar para barbearias
      </Button>
    </div>
  )
}
