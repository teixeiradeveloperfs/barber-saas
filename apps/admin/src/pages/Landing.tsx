import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

/** Para onde cada pessoa cai ao entrar: plataforma, dono e gestor no Início; barbeiro na agenda. */
export function Landing() {
  const { admin, isPlatform, ready } = useAuth()
  if (!admin) return null
  if (isPlatform) return <Navigate to="/inicio" replace />
  // Espera o perfil com os papéis por barbearia; logo após o login ele ainda não chegou.
  if (!ready) return null
  // Só parceiro (sem barbearia): cai no programa de parceiros.
  if (admin.tenants.length === 0) return <Navigate to="/parceiro" replace />
  // Dono e gestor começam no Início da barbearia; barbeiro, na própria agenda.
  const manages = admin.tenants.some((tenant) => tenant.role !== 'BARBEIRO')
  return <Navigate to={manages ? '/inicio' : '/agenda'} replace />
}
