import type { Address, Contact } from '@barber/tenant-config'
import { useState } from 'react'
import { Card } from '../../components/Card/Card'
import { Grid, Stack } from '../../editor/fields/Grid'
import { useEditor } from '../../editor/useEditor'
import { TextField } from '../../ui/TextField/TextField'

function formatPhone(digits: string) {
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
  if (local.length <= 2) return local
  if (local.length <= 6) return `(${local.slice(0, 2)}) ${local.slice(2)}`
  if (local.length <= 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7, 11)}`
}

/** Passo 2: nome, contato e endereço. CEP preenche rua, bairro, cidade e UF (ViaCEP). */
export function StepData() {
  const { working, patch, issue } = useEditor()
  const { address, contact } = working
  const [cepState, setCepState] = useState<'idle' | 'buscando' | 'nao-achei'>('idle')
  const setAddress = (next: Partial<Address>) => patch((config) => ({ ...config, address: { ...config.address, ...next } }))
  const setContact = (next: Partial<Contact>) => patch((config) => ({ ...config, contact: { ...config.contact, ...next } }))
  const whatsappLocal = contact.whatsapp === '5500000000000' ? '' : contact.whatsapp.replace(/^55/, '')

  async function lookupCep(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    setAddress({ zip: digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits })
    if (digits.length !== 8) return
    setCepState('buscando')
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = (await response.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string }
      if (data.erro) return setCepState('nao-achei')
      setAddress({
        street: data.logradouro ? `${data.logradouro}, ` : address.street,
        district: data.bairro || address.district,
        city: data.localidade || address.city,
        state: data.uf || address.state,
      })
      setCepState('idle')
    } catch {
      setCepState('nao-achei')
    }
  }

  return (
    <>
      <Card title="Sua barbearia" description="Como os clientes veem o nome e falam com vocês.">
        <Stack>
          <TextField label="Nome da barbearia" value={working.name} onChange={(name) => patch((config) => ({ ...config, name }))} error={issue('name')} />
          <Grid>
            <TextField
              label="WhatsApp da barbearia"
              value={formatPhone(whatsappLocal)}
              onChange={(value) => {
                const digits = value.replace(/\D/g, '').slice(0, 11)
                setContact({ whatsapp: digits ? `55${digits}` : '5500000000000' })
              }}
              inputMode="tel"
              placeholder="(11) 98765-4321"
              error={issue('contact.whatsapp')}
              hint="O botão de WhatsApp do app abre aqui."
            />
            <TextField label="Instagram (opcional)" value={contact.instagram ?? ''} onChange={(instagram) => setContact({ instagram: instagram.replace(/^@/, '') || undefined })} placeholder="suabarbearia" hint="Sem o @." />
          </Grid>
          <TextField label="Telefone fixo (opcional)" value={contact.phone} onChange={(phone) => setContact({ phone })} inputMode="tel" error={issue('contact.phone')} />
        </Stack>
      </Card>

      <Card title="Endereço" description="Aparece no app com os atalhos para Waze, Google Maps e Uber.">
        <Stack>
          <Grid>
            <TextField
              label="CEP"
              value={address.zip}
              onChange={lookupCep}
              inputMode="numeric"
              error={issue('address.zip')}
              hint={cepState === 'buscando' ? 'Buscando endereço…' : cepState === 'nao-achei' ? 'CEP não encontrado: preencha à mão.' : 'Preenche rua, bairro e cidade.'}
            />
            <TextField label="Rua e número" value={address.street} onChange={(street) => setAddress({ street })} error={issue('address.street')} />
          </Grid>
          <Grid cols={3}>
            <TextField label="Bairro" value={address.district} onChange={(district) => setAddress({ district })} error={issue('address.district')} />
            <TextField label="Cidade" value={address.city} onChange={(city) => setAddress({ city })} error={issue('address.city')} />
            <TextField label="UF" value={address.state} onChange={(state) => setAddress({ state: state.toUpperCase().slice(0, 2) })} maxLength={2} error={issue('address.state')} />
          </Grid>
        </Stack>
      </Card>
    </>
  )
}
