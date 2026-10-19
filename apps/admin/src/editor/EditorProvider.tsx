import { appConfigSchema, type AppConfig } from '@barber/tenant-config'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { adminApi, type TenantDetail } from '../api/admin'
import { ApiError } from '../api/client'
import { useToast } from '../components/Toast/useToast'
import { errorMessage } from '../lib/format'
import { EditorContext, type EditorState } from './editor-context'

type Props = {
  tenant: TenantDetail
  mutate: (updater: (current: TenantDetail) => TenantDetail) => void
  children: ReactNode
}

export function EditorProvider({ tenant, mutate, children }: Props) {
  const toast = useToast()
  const base = tenant.configs.draft?.config ?? tenant.configs.published?.config ?? null
  // `edits` nulo = sem alterações locais; a base vem sempre do servidor.
  const [edits, setEdits] = useState<{ installationId: string; config: AppConfig } | null>(null)
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [publishing, setPublishing] = useState(false)

  const localEdits = edits && edits.installationId === tenant.id ? edits.config : null
  const working = localEdits ?? base
  const dirty = localEdits !== null

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const patch = useCallback(
    (updater: (config: AppConfig) => AppConfig) => {
      setEdits((current) => {
        const from = current && current.installationId === tenant.id ? current.config : base
        if (!from) return current
        return { installationId: tenant.id, config: updater(from) }
      })
    },
    [tenant.id, base],
  )

  const reset = useCallback(() => {
    setEdits(null)
    setIssues({})
  }, [])

  const save = useCallback(async () => {
    if (!working) return false
    const parsed = appConfigSchema.safeParse(working)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.map(String).join('.')
        if (!next[path]) next[path] = issue.message
      }
      setIssues(next)
      toast({ kind: 'erro', title: 'Alguns campos precisam de atenção', detail: `${Object.keys(next).length} ${Object.keys(next).length === 1 ? 'campo inválido' : 'campos inválidos'}.` })
      return false
    }

    setSaving(true)
    try {
      const draft = await adminApi.saveDraft(tenant.id, parsed.data)
      mutate((current) => ({ ...current, configs: { ...current.configs, draft } }))
      setEdits(null)
      setIssues({})
      setSavedCount((value) => value + 1)
      toast({ kind: 'ok', title: 'Rascunho salvo', detail: 'Publique na Visão geral quando estiver pronto.' })
      return true
    } catch (caught) {
      if (caught instanceof ApiError && caught.issues.length) {
        setIssues(Object.fromEntries(caught.issues.map((issue) => [issue.path, issue.message])))
        toast({ kind: 'erro', title: 'A API recusou o rascunho', detail: caught.issues[0]?.message })
      } else {
        toast({ kind: 'erro', title: 'Não foi possível salvar', detail: errorMessage(caught) })
      }
      return false
    } finally {
      setSaving(false)
    }
  }, [working, tenant.id, mutate, toast])

  const saveAndPublish = useCallback(async () => {
    if (dirty) {
      const ok = await save()
      if (!ok) return false
    }
    setPublishing(true)
    try {
      const configs = await adminApi.publish(tenant.id)
      mutate((current) => ({ ...current, configs }))
      toast({ kind: 'ok', title: `Versão ${configs.published?.version ?? ''} publicada`, detail: 'O app dos clientes já mostra a nova configuração.' })
      return true
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não foi possível publicar', detail: errorMessage(caught) })
      return false
    } finally {
      setPublishing(false)
    }
  }, [dirty, save, tenant.id, mutate, toast])

  const issue = useCallback((path: string) => issues[path], [issues])

  const value = useMemo<EditorState>(
    () => ({ working, dirty, saving, savedCount, issues, issue, patch, reset, save, saveAndPublish, hasDraft: Boolean(tenant.configs.draft), draftVersion: tenant.configs.draft?.version ?? null, publishing }),
    [working, dirty, saving, savedCount, issues, issue, patch, reset, save, saveAndPublish, tenant.configs.draft, publishing],
  )

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}
