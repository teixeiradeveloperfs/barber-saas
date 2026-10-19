import { Card } from '../../../components/Card/Card'
import { Stack } from '../../../editor/fields/Grid'
import { useEditor } from '../../../editor/useEditor'
import { Switch } from '../../../ui/Switch/Switch'

export function FeaturesEditor() {
  const { working, patch } = useEditor()
  const { features } = working
  const set = (next: Partial<typeof features>) => patch((config) => ({ ...config, features: { ...config.features, ...next } }))

  return (
    <Card title="Recursos do app" description="Ligue e desligue partes do app sem mexer no resto. Vale para os clientes depois de publicar.">
      <Stack>
        <Switch checked={features.pwa} onChange={(pwa) => set({ pwa })} label="Instalação como app (PWA)" description="Guia de instalação e ícone na tela inicial do celular." />
        <Switch checked={features.installBanner} onChange={(installBanner) => set({ installBanner })} label="Faixa de instalação no início" description="Convite discreto para instalar, mostrado uma vez." disabled={!features.pwa} />
        <Switch checked={features.googleLogin} onChange={(googleLogin) => set({ googleLogin })} label="Entrar com Google" description="Botão de login social nas telas de entrar e cadastrar." />
        <Switch checked={working.club.enabled} onChange={(enabled) => patch((config) => ({ ...config, club: { ...config.club, enabled } }))} label={`${working.club.name} (assinatura)`} description="Planos mensais com créditos. Também na aba Clube." />
        <Switch checked={working.loyalty.enabled} onChange={(enabled) => patch((config) => ({ ...config, loyalty: { ...config.loyalty, enabled } }))} label="Fidelidade" description="Selos, pontos, níveis e recompensas. Também na aba Fidelidade." />
      </Stack>
    </Card>
  )
}
