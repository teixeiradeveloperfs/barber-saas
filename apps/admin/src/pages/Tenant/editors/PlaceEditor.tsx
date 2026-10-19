import type { Address, Contact, OpeningHours } from '@barber/tenant-config'
import { Card } from '../../../components/Card/Card'
import { Grid, Stack } from '../../../editor/fields/Grid'
import { NumberField } from '../../../editor/fields/NumberField'
import { useEditor } from '../../../editor/useEditor'
import { Switch } from '../../../ui/Switch/Switch'
import { TextField } from '../../../ui/TextField/TextField'
import styles from './editors.module.css'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function PlaceEditor() {
  const { working, patch, issue } = useEditor()
  const { address, contact, hours } = working
  const setAddress = (next: Partial<Address>) => patch((config) => ({ ...config, address: { ...config.address, ...next } }))
  const setContact = (next: Partial<Contact>) => patch((config) => ({ ...config, contact: { ...config.contact, ...next } }))
  const setHour = (day: number, next: Partial<OpeningHours>) =>
    patch((config) => ({ ...config, hours: config.hours.map((row) => (row.day === day ? { ...row, ...next } : row)) }))

  const rows = [...hours].sort((a, b) => a.day - b.day)

  return (
    <>
      <Card title="Endereço" description="Usado no cartão de localização e nos links para Waze, Google Maps e Uber.">
        <Stack>
          <Grid>
            <TextField label="Rua e número" value={address.street} onChange={(street) => setAddress({ street })} error={issue('address.street')} />
            <TextField label="Complemento" value={address.complement ?? ''} onChange={(complement) => setAddress({ complement: complement || undefined })} error={issue('address.complement')} />
          </Grid>
          <Grid cols={4}>
            <TextField label="Bairro" value={address.district} onChange={(district) => setAddress({ district })} error={issue('address.district')} />
            <TextField label="Cidade" value={address.city} onChange={(city) => setAddress({ city })} error={issue('address.city')} />
            <TextField label="UF" value={address.state} onChange={(state) => setAddress({ state: state.toUpperCase().slice(0, 2) })} error={issue('address.state')} maxLength={2} />
            <TextField label="CEP" value={address.zip} onChange={(zip) => setAddress({ zip })} error={issue('address.zip')} inputMode="numeric" />
          </Grid>
          <Grid>
            <NumberField label="Latitude" value={address.lat} onChange={(lat) => setAddress({ lat })} decimals error={issue('address.lat')} hint="Clique com o botão direito no Google Maps e copie as coordenadas." />
            <NumberField label="Longitude" value={address.lng} onChange={(lng) => setAddress({ lng })} decimals error={issue('address.lng')} />
          </Grid>
          <TextField label="Estacionamento" value={working.parking ?? ''} onChange={(parking) => patch((config) => ({ ...config, parking: parking || undefined }))} error={issue('parking')} hint="Opcional. Ex.: Estacionamento conveniado ao lado, 2h grátis." />
        </Stack>
      </Card>

      <Card title="Contato">
        <Grid>
          <TextField label="Telefone" value={contact.phone} onChange={(phone) => setContact({ phone })} error={issue('contact.phone')} hint="Como aparece no app. Ex.: (11) 3456-7890" inputMode="tel" />
          <TextField label="WhatsApp" value={contact.whatsapp} onChange={(whatsapp) => setContact({ whatsapp: whatsapp.replace(/\D/g, '') })} error={issue('contact.whatsapp')} hint="Só números com DDI. Ex.: 5511987654321" inputMode="numeric" />
          <TextField label="Instagram" value={contact.instagram ?? ''} onChange={(instagram) => setContact({ instagram: instagram.replace(/^@/, '') || undefined })} error={issue('contact.instagram')} hint="Sem o @." />
          <TextField label="E-mail" value={contact.email ?? ''} onChange={(email) => setContact({ email: email || undefined })} error={issue('contact.email')} type="email" />
        </Grid>
      </Card>

      <Card title="Horários" description="Dias fechados não recebem agendamentos.">
        <div className={styles.hours}>
          {rows.map((row) => {
            const open = Boolean(row.open && row.close)
            return (
              <div key={row.day} className={styles.hourRow}>
                <Switch
                  checked={open}
                  onChange={(checked) => setHour(row.day, checked ? { open: row.open ?? '09:00', close: row.close ?? '19:00' } : { open: undefined, close: undefined })}
                  label={DAYS[row.day]}
                  description={open ? undefined : 'Fechado'}
                />
                {open && (
                  <div className={styles.times}>
                    <label className={styles.time}>
                      <span>Abre</span>
                      <input type="time" value={row.open} onChange={(event) => setHour(row.day, { open: event.target.value })} aria-invalid={issue(`hours.${row.day}.open`) ? true : undefined} />
                    </label>
                    <label className={styles.time}>
                      <span>Fecha</span>
                      <input type="time" value={row.close} onChange={(event) => setHour(row.day, { close: event.target.value })} aria-invalid={issue(`hours.${row.day}.close`) ? true : undefined} />
                    </label>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
