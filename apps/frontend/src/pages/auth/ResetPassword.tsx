import { Navigate } from 'react-router-dom'

/** Rota antiga do link por e-mail: a recuperação agora é por código no WhatsApp/SMS. */
export function ResetPassword() {
  return <Navigate to="/recuperar-senha" replace />
}
