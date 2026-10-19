import { useRef, useState } from 'react'
import { adminApi, type NotificationTemplate, type TemplateVariable } from '../../api/admin'
import { useToast } from '../../components/Toast/useToast'
import { errorMessage } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { Select } from '../../ui/Select/Select'
import { Switch } from '../../ui/Switch/Switch'
import { TextArea } from '../../ui/TextArea/TextArea'
import { Bubble } from './Bubble'
import { EVENT_INFO, reminderLabel, renderExample } from './whatsapp'
import styles from './WhatsAppPage.module.css'

type Props = {
  installationId: string
  template: NotificationTemplate
  variables: TemplateVariable[]
  reminderOptions: number[]
  onSaved: (next: NotificationTemplate) => void
}

/** Um aviso: liga/desliga, texto com variáveis, antecedência (lembrete) e prévia no balão. */
export function TemplateCard({ installationId, template, variables, reminderOptions, onSaved }: Props) {
  const toast = useToast()
  const [enabled, setEnabled] = useState(template.enabled)
  const [text, setText] = useState(template.text)
  const [offset, setOffset] = useState(String(template.offsetMin ?? 180))
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const area = useRef<HTMLTextAreaElement | null>(null)
  const info = EVENT_INFO[template.event]
  const reminder = template.event === 'LEMBRETE'
  const dirty = enabled !== template.enabled || text !== template.text || (reminder && Number(offset) !== template.offsetMin)
  const examples = Object.fromEntries(variables.map((variable) => [variable.key, variable.example]))
  const unknown = Array.from(text.matchAll(/\{(\w+)\}/g))
    .map((match) => match[1])
    .filter((key) => !(key in examples))

  function insert(key: string) {
    const field = area.current
    const token = `{${key}}`
    if (!field) return setText((value) => value + token)
    const start = field.selectionStart ?? text.length
    const end = field.selectionEnd ?? text.length
    const next = text.slice(0, start) + token + text.slice(end)
    setText(next)
    requestAnimationFrame(() => {
      field.focus()
      field.setSelectionRange(start + token.length, start + token.length)
    })
  }

  async function save(nextEnabled = enabled) {
    if (!text.trim()) return toast({ kind: 'erro', title: 'Escreva a mensagem antes de salvar.' })
    setSaving(true)
    try {
      const saved = await adminApi.saveWhatsappTemplate(installationId, template.event, { enabled: nextEnabled, text, offsetMin: reminder ? Number(offset) : null })
      onSaved(saved)
      setEnabled(saved.enabled)
      setText(saved.text)
      toast({ kind: 'ok', title: saved.enabled ? `"${info.title}" salvo` : `"${info.title}" desligado` })
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não deu para salvar', detail: errorMessage(caught) })
    } finally {
      setSaving(false)
    }
  }

  async function reset() {
    setSaving(true)
    try {
      const saved = await adminApi.resetWhatsappTemplate(installationId, template.event)
      onSaved(saved)
      setEnabled(saved.enabled)
      setText(saved.text)
      setOffset(String(saved.offsetMin ?? 180))
      toast({ kind: 'ok', title: 'Texto padrão de volta' })
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não deu para restaurar', detail: errorMessage(caught) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className={[styles.template, !enabled && styles.templateOff].filter(Boolean).join(' ')}>
      <Switch
        checked={enabled}
        onChange={(value) => {
          setEnabled(value)
          // Ligar ou desligar vale na hora; o texto só com "Salvar".
          if (text === template.text) void save(value)
        }}
        label={info.title}
        description={info.when}
      />

      {enabled && !open && (
        <div className={styles.summary}>
          <p className={styles.summaryText}>
            {reminder && <strong>{reminderLabel(Number(offset))} · </strong>}
            {renderExample(text, examples).replace(/[*_~]/g, '').replace(/\s+/g, ' ')}
          </p>
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
            Editar mensagem
          </Button>
        </div>
      )}

      {enabled && open && (
        <div className={styles.templateBody}>
          <div className={styles.editor}>
            {reminder && (
              <Select
                label="Quando enviar"
                value={offset}
                onChange={setOffset}
                options={reminderOptions.map((minutes) => ({ value: String(minutes), label: reminderLabel(minutes) }))}
                hint="Quem agenda já dentro desse prazo recebe o pedido de confirmação logo depois de agendar (se faltar pelo menos 20 min)."
              />
            )}
            <TextArea
              label="Mensagem"
              value={text}
              onChange={setText}
              rows={reminder ? 7 : 4}
              maxLength={1000}
              ref={area}
              error={unknown.length ? `Variável desconhecida: ${unknown.map((key) => `{${key}}`).join(', ')}` : undefined}
              hint="*negrito*, _itálico_. Toque numa variável para inserir onde está o cursor."
            />
            <div className={styles.chips} aria-label="Variáveis">
              {variables.map((variable) => (
                <button key={variable.key} type="button" className={styles.chip} title={variable.label} onClick={() => insert(variable.key)}>
                  {`{${variable.key}}`}
                </button>
              ))}
            </div>
            <div className={styles.row}>
              <Button size="sm" onClick={() => save()} disabled={!dirty || unknown.length > 0} loading={saving}>
                Salvar
              </Button>
              {dirty && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setText(template.text)
                    setEnabled(template.enabled)
                    setOffset(String(template.offsetMin ?? 180))
                  }}
                >
                  Descartar
                </Button>
              )}
              {template.custom && !dirty && (
                <Button size="sm" variant="ghost" onClick={reset} loading={saving}>
                  Voltar ao padrão
                </Button>
              )}
              {!dirty && (
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  Fechar
                </Button>
              )}
            </div>
          </div>
          <Bubble text={renderExample(text, examples)} />
        </div>
      )}
    </article>
  )
}
