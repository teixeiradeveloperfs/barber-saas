import { useContext } from 'react'
import { AppointmentsContext } from './appointments-context'

export function useAppointments() {
  const context = useContext(AppointmentsContext)
  if (!context) throw new Error('useAppointments precisa estar dentro de <AppointmentsProvider>')
  return context
}
