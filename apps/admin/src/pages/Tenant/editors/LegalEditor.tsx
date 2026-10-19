import type { LegalDocument } from '@barber/tenant-config'
import { useState } from 'react'
import { Card } from '../../../components/Card/Card'
import { Grid, Stack } from '../../../editor/fields/Grid'
import { LinesField } from '../../../editor/fields/LinesField'
import { Repeater } from '../../../editor/fields/Repeater'
import { uniqueSlug } from '../../../editor/ids'
import { useEditor } from '../../../editor/useEditor'
import { Segmented } from '../../../ui/Segmented/Segmented'
import { TextField } from '../../../ui/TextField/TextField'
import styles from './editors.module.css'

type DocKey = 'terms' | 'privacy'

export function LegalEditor() {
  const { working, patch, issue } = useEditor()
  const [doc, setDoc] = useState<DocKey>('terms')
  const document = working.legal[doc]
  const set = (next: Partial<LegalDocument>) => patch((config) => ({ ...config, legal: { ...config.legal, [doc]: { ...config.legal[doc], ...next } } }))
  const prefix = `legal.${doc}`

  return (
    <>
      <Card title="Documentos legais" description="Os textos de exemplo são um ponto de partida. Revise com um advogado antes de publicar.">
        <Stack>
          <div className={styles.docSwitch}>
            <Segmented
              aria-label="Documento"
              value={doc}
              onChange={setDoc}
              options={[
                { value: 'terms', label: 'Termos de uso' },
                { value: 'privacy', label: 'Privacidade' },
              ]}
            />
          </div>
          <Grid>
            <TextField label="Título" value={document.title} onChange={(title) => set({ title })} error={issue(`${prefix}.title`)} />
            <TextField label="Última atualização" value={document.updatedAt} onChange={(updatedAt) => set({ updatedAt })} error={issue(`${prefix}.updatedAt`)} hint="Texto livre. Ex.: 17 de setembro de 2026" />
          </Grid>
          <TextField label="Subtítulo" value={document.subtitle} onChange={(subtitle) => set({ subtitle })} error={issue(`${prefix}.subtitle`)} />
        </Stack>
      </Card>

      <Card title="Seções" key={doc}>
        <Repeater
          items={document.sections}
          onChange={(sections) => set({ sections })}
          title={(section) => section.title}
          addLabel="Adicionar seção"
          create={() => ({ id: uniqueSlug('nova-secao', document.sections.map((s) => s.id)), title: '', paragraphs: [] })}
        >
          {(section, index, update) => (
            <Stack>
              <TextField label="Título" value={section.title} onChange={(title) => update({ title, id: uniqueSlug(title, document.sections.filter((_, i) => i !== index).map((s) => s.id), section.id) })} error={issue(`${prefix}.sections.${index}.title`)} />
              <LinesField label="Parágrafos" value={section.paragraphs} onChange={(paragraphs) => update({ paragraphs })} rows={5} hint="Um parágrafo por linha." error={issue(`${prefix}.sections.${index}.paragraphs`)} />
              <LinesField label="Lista (opcional)" value={section.bullets ?? []} onChange={(bullets) => update({ bullets: bullets.length ? bullets : undefined })} rows={3} hint="Itens em marcadores, um por linha." error={issue(`${prefix}.sections.${index}.bullets`)} />
            </Stack>
          )}
        </Repeater>
      </Card>
    </>
  )
}
