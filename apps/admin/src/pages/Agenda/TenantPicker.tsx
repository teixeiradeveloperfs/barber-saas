import { useAuth } from '../../auth/useAuth'
import styles from './AgendaPage.module.css'

/** Troca a barbearia da agenda. Some quando só existe uma. */
export function TenantPicker({ current, onChange }: { current: string; onChange: (id: string) => void }) {
  const { admin } = useAuth()
  const options = (admin?.tenants ?? []).map((tenant) => ({ id: tenant.id, name: tenant.name }))
  if (options.length <= 1) return null
  return (
    <select className={styles.select} value={current} onChange={(event) => onChange(event.target.value)} aria-label="Barbearia da agenda">
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  )
}
