import type { Copy } from '@barber/tenant-config'
import { Card } from '../../../components/Card/Card'
import { Stack } from '../../../editor/fields/Grid'
import { useEditor } from '../../../editor/useEditor'
import { TextArea } from '../../../ui/TextArea/TextArea'
import { TextField } from '../../../ui/TextField/TextField'

export function CopyEditor() {
  const { working, patch, issue } = useEditor()
  const { copy } = working
  const set = (next: Partial<Copy>) => patch((config) => ({ ...config, copy: { ...config.copy, ...next } }))

  return (
    <>
      <Card title="Tela inicial" description="O que o cliente lê antes de entrar.">
        <Stack>
          <TextArea label="Frase principal" value={copy.splashHeadline} onChange={(splashHeadline) => set({ splashHeadline })} rows={2} error={issue('copy.splashHeadline')} hint="Curta e direta. Até duas linhas no celular." />
          <TextField label="Botão" value={copy.splashCta} onChange={(splashCta) => set({ splashCta })} error={issue('copy.splashCta')} />
        </Stack>
      </Card>
      <Card title="Início" description="Saudação de quem já entrou.">
        <Stack>
          <TextField label="Título" value={copy.homeTitle} onChange={(homeTitle) => set({ homeTitle })} error={issue('copy.homeTitle')} hint="Use {nome} para o primeiro nome do cliente." />
          <TextArea label="Subtítulo" value={copy.homeSubtitle} onChange={(homeSubtitle) => set({ homeSubtitle })} rows={2} error={issue('copy.homeSubtitle')} />
          <TextField label="Placeholder da busca" value={copy.searchPlaceholder} onChange={(searchPlaceholder) => set({ searchPlaceholder })} error={issue('copy.searchPlaceholder')} />
        </Stack>
      </Card>
      <Card title="Login e cadastro">
        <TextArea label="Frase de apoio" value={copy.authClaim} onChange={(authClaim) => set({ authClaim })} rows={2} error={issue('copy.authClaim')} hint="Aparece ao lado do formulário no desktop." />
      </Card>
    </>
  )
}
