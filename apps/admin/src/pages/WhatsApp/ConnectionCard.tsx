import { useEffect, useState, type FormEvent } from 'react'
import { adminApi, type WhatsappConnection } from '../../api/admin'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { useToast } from '../../components/Toast/useToast'
import { errorMessage, formatDateTime, formatPhone } from '../../lib/format'
import { Button } from '../../ui/Button/Button'
import { Dialog } from '../../ui/Dialog/Dialog'
import { Segmented } from '../../ui/Segmented/Segmented'
import { TextField } from '../../ui/TextField/TextField'
import styles from './WhatsAppPage.module.css'

type Props = {
  installationId: string
  connection: WhatsappConnection
  owner: boolean
  onChange: (next: WhatsappConnection) => void
  onReload: () => void
}

const STATUS: Record<WhatsappConnection['status'], { label: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' }> = {
  CONECTADO: { label: 'Conectado', tone: 'ok' },
  CONECTANDO: { label: 'Conectando', tone: 'warn' },
  AGUARDANDO_QR: { label: 'Esperando o celular', tone: 'warn' },
  FALHOU: { label: 'Caiu', tone: 'danger' },
  DESCONECTADO: { label: 'Desconectado', tone: 'neutral' },
}

/** Liga o número da barbearia: QR ou código, e mostra o estado da conexão. */
export function ConnectionCard({ installationId, connection, owner, onChange, onReload }: Props) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'qr' | 'codigo'>('qr')
  const [qr, setQr] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | undefined>()
  const [confirmOff, setConfirmOff] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const waiting = connection.status === 'AGUARDANDO_QR' || connection.status === 'CONECTANDO'

  // Enquanto espera o celular, confere o estado a cada 3 s.
  useEffect(() => {
    if (!waiting) return
    const timer = window.setInterval(onReload, 3000)
    return () => window.clearInterval(timer)
  }, [waiting, onReload])

  // O QR do WhatsApp troca a cada ~20 s: busca de novo.
  useEffect(() => {
    if (connection.status !== 'AGUARDANDO_QR' || mode !== 'qr' || !owner) return
    let alive = true
    const load = () =>
      adminApi
        .whatsappQr(installationId)
        .then((result) => {
          if (!alive) return
          setQr(result.image)
          setQrError(null)
        })
        .catch((caught: unknown) => alive && setQrError(errorMessage(caught)))
    void load()
    const timer = window.setInterval(load, 15000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [connection.status, mode, owner, installationId])

  async function connect() {
    setBusy(true)
    setCode(null)
    try {
      onChange(await adminApi.whatsappConnect(installationId))
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não deu para iniciar a conexão', detail: errorMessage(caught) })
    } finally {
      setBusy(false)
    }
  }

  async function requestCode(event: FormEvent) {
    event.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return setCodeError('Informe o WhatsApp da barbearia com DDD.')
    setCodeError(undefined)
    setBusy(true)
    try {
      setCode((await adminApi.whatsappPairingCode(installationId, digits)).code)
    } catch (caught) {
      setCodeError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    setBusy(true)
    try {
      onChange(await adminApi.whatsappDisconnect(installationId))
      setConfirmOff(false)
      setQr(null)
      setCode(null)
      toast({ kind: 'ok', title: 'WhatsApp desconectado', detail: 'Os avisos param até você conectar de novo.' })
    } catch (caught) {
      toast({ kind: 'erro', title: 'Não deu para desconectar', detail: errorMessage(caught) })
    } finally {
      setBusy(false)
    }
  }

  async function sendTest(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await adminApi.whatsappTest(installationId, { phone: testPhone, event: 'LEMBRETE' })
      if (result.status === 'FALHOU') toast({ kind: 'erro', title: 'Mensagem não enviada', detail: result.error ?? undefined })
      else toast({ kind: 'ok', title: 'Mensagem de teste enviada', detail: `Confira o WhatsApp ${formatPhone(testPhone.replace(/\D/g, ''))}.` })
      setTestOpen(false)
    } catch (caught) {
      toast({ kind: 'erro', title: 'Mensagem não enviada', detail: errorMessage(caught) })
    } finally {
      setBusy(false)
    }
  }

  const status = STATUS[connection.status]

  if (!connection.available) {
    return (
      <Card title="Número da barbearia">
        <p className={styles.muted}>O envio por WhatsApp ainda não está ligado nesta plataforma. Fale com o suporte da Sua Barbearia.</p>
      </Card>
    )
  }

  return (
    <Card title="Número da barbearia" description="Os avisos saem do WhatsApp da barbearia, direto na conversa com cada cliente." actions={<Badge tone={status.tone}>{status.label}</Badge>}>
      <div className={styles.connection}>
        {connection.status === 'CONECTADO' && (
          <>
            <div className={styles.connected}>
              <span className={styles.phone}>{connection.phone ? formatPhone(connection.phone) : 'Número conectado'}</span>
              <span className={styles.muted}>
                {connection.name ? `${connection.name} · ` : ''}
                {connection.connectedAt ? `conectado em ${formatDateTime(connection.connectedAt)}` : 'conectado'}
              </span>
            </div>
            <p className={styles.muted}>Pode seguir usando o WhatsApp no celular normalmente. O painel só envia os avisos e lê as respostas 1 e 2 dos lembretes.</p>
            <div className={styles.row}>
              <Button size="sm" onClick={() => setTestOpen(true)}>
                Enviar teste
              </Button>
              {owner && (
                <Button size="sm" variant="ghost" onClick={() => setConfirmOff(true)}>
                  Desconectar
                </Button>
              )}
            </div>
          </>
        )}

        {(connection.status === 'DESCONECTADO' || connection.status === 'FALHOU') && (
          <>
            {connection.lastError && <p className={styles.warning}>{connection.lastError}</p>}
            <ol className={styles.steps}>
              <li>Tenha em mãos o celular com o WhatsApp da barbearia (pode ser o WhatsApp Business).</li>
              <li>Clique em conectar e leia o QR, ou use o código de 8 letras.</li>
              <li>Pronto: lembretes e avisos de cancelamento saem sozinhos.</li>
            </ol>
            {owner ? (
              <div className={styles.row}>
                <Button onClick={connect} loading={busy}>
                  {connection.status === 'FALHOU' ? 'Conectar de novo' : 'Conectar WhatsApp'}
                </Button>
              </div>
            ) : (
              <p className={styles.muted}>Só o dono da barbearia conecta o número.</p>
            )}
          </>
        )}

        {connection.status === 'CONECTANDO' && <p className={styles.muted}>Preparando a conexão…</p>}

        {connection.status === 'AGUARDANDO_QR' && owner && (
          <>
            {connection.lastError && <p className={styles.warning}>{connection.lastError}</p>}
            <Segmented
              aria-label="Como conectar"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'qr', label: 'Ler QR' },
                { value: 'codigo', label: 'Usar código' },
              ]}
            />
            {mode === 'qr' ? (
              <div className={styles.pair}>
                <div className={styles.qrBox}>{qr ? <img src={qr} alt="QR para conectar o WhatsApp" className={styles.qr} /> : <span className={styles.muted}>{qrError ?? 'Gerando QR…'}</span>}</div>
                <ol className={styles.steps}>
                  <li>No celular da barbearia, abra o WhatsApp.</li>
                  <li>
                    Toque em <strong>Mais opções</strong> (Android) ou <strong>Configurações</strong> (iPhone) › <strong>Dispositivos conectados</strong>.
                  </li>
                  <li>
                    Toque em <strong>Conectar dispositivo</strong> e aponte para o QR.
                  </li>
                </ol>
              </div>
            ) : (
              <div className={styles.pair}>
                {code ? (
                  <div className={styles.codeBox}>
                    <span className={styles.code}>{code}</span>
                    <span className={styles.muted}>Vale por poucos minutos.</span>
                  </div>
                ) : (
                  <form className={styles.codeForm} onSubmit={requestCode} noValidate>
                    <TextField label="WhatsApp da barbearia" value={phone} onChange={setPhone} placeholder="(11) 98765-4321" inputMode="tel" error={codeError} />
                    <Button type="submit" loading={busy}>
                      Gerar código
                    </Button>
                  </form>
                )}
                <ol className={styles.steps}>
                  <li>No WhatsApp da barbearia, vá em <strong>Dispositivos conectados</strong> › <strong>Conectar dispositivo</strong>.</li>
                  <li>
                    Toque em <strong>Conectar com número de telefone</strong>.
                  </li>
                  <li>Digite o código que aparece aqui.</li>
                </ol>
              </div>
            )}
            <div className={styles.row}>
              <Button size="sm" variant="ghost" onClick={disconnect} loading={busy}>
                Cancelar
              </Button>
            </div>
          </>
        )}
        {connection.status === 'AGUARDANDO_QR' && !owner && <p className={styles.muted}>O dono está conectando o número.</p>}
      </div>

      <Dialog
        open={confirmOff}
        onClose={() => setConfirmOff(false)}
        title="Desconectar o WhatsApp?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmOff(false)}>
              Manter conectado
            </Button>
            <Button variant="danger" onClick={disconnect} loading={busy}>
              Desconectar
            </Button>
          </>
        }
      >
        <p className={styles.muted}>Os lembretes e avisos param de sair até alguém conectar de novo. As conversas no celular não são apagadas.</p>
      </Dialog>

      <Dialog
        open={testOpen}
        onClose={() => setTestOpen(false)}
        title="Enviar mensagem de teste"
        actions={
          <>
            <Button variant="ghost" type="button" onClick={() => setTestOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="whatsapp-teste" loading={busy} disabled={testPhone.replace(/\D/g, '').length < 10}>
              Enviar
            </Button>
          </>
        }
      >
        <form id="whatsapp-teste" className={styles.dialogForm} onSubmit={sendTest} noValidate>
          <p className={styles.muted}>Vai o lembrete com dados de exemplo.</p>
          <TextField label="Para qual WhatsApp?" value={testPhone} onChange={setTestPhone} placeholder="(11) 98765-4321" inputMode="tel" />
        </form>
      </Dialog>
    </Card>
  )
}
