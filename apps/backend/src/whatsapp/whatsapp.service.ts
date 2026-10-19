import { createHmac, timingSafeEqual } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WhatsappConnection } from '../generated/prisma/client.js';
import type { NotificationEvent, WhatsappStatus } from '../generated/prisma/enums.js';
import { resolvePublicApiUrl } from '../media/media-storage.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { withCountry } from './phone.js';
import { WahaClient, WahaError, type WahaSession, type WahaStatus } from './waha.client.js';

const WATCH_EVERY_MS = 3 * 60_000;
/** Intervalo mínimo entre mensagens da mesma barbearia (mais um sorteio de até 2 s). */
const MIN_GAP_MS = 2500;

export function mapStatus(status: WahaStatus): WhatsappStatus {
  switch (status) {
    case 'WORKING':
      return 'CONECTADO';
    case 'STARTING':
      return 'CONECTANDO';
    case 'SCAN_QR_CODE':
    case 'PASSKEY_REQUIRED':
    case 'PASSKEY_CONFIRMATION_REQUIRED':
      return 'AGUARDANDO_QR';
    case 'FAILED':
      return 'FALHOU';
    default:
      return 'DESCONECTADO';
  }
}

export type SendMeta = { appointmentId?: string | null; event?: NotificationEvent | null };

/**
 * Número de WhatsApp de cada barbearia: uma sessão no WAHA por barbearia,
 * ligada por QR ou código. Um vigia religa sessões que caíram, e o envio passa
 * por uma fila por barbearia com intervalo entre mensagens.
 */
@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('WhatsApp');
  private timer: NodeJS.Timeout | null = null;
  private watching = false;
  private readonly queues = new Map<string, Promise<unknown>>();
  private readonly lastSent = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    readonly waha: WahaClient,
    private readonly env: ConfigService,
  ) {}

  onModuleInit() {
    if (!this.waha.enabled) return;
    // Primeira volta logo depois de subir: religa sessões depois de deploy.
    setTimeout(() => void this.watch(), 20_000).unref();
    this.timer = setInterval(() => void this.watch(), WATCH_EVERY_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  sessionName(_installationId: string) {
    return 'barber_singleton';
  }

  /** Segredo que o WAHA manda no cabeçalho do webhook. Derivado da chave do WAHA se não houver um próprio. */
  get webhookToken() {
    const own = this.env.get<string>('WAHA_WEBHOOK_TOKEN')?.trim();
    if (own) return own;
    return createHmac('sha256', this.env.get<string>('WAHA_API_KEY') ?? 'sem-chave').update('barberos-webhook').digest('hex');
  }

  checkWebhookToken(received: string | undefined) {
    if (!received) return false;
    const expected = Buffer.from(this.webhookToken);
    const given = Buffer.from(received);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  private sessionConfig(_installationId: string) {
    const url = this.env.get<string>('WHATSAPP_WEBHOOK_URL')?.trim() || `${resolvePublicApiUrl(this.env)}/platform/whatsapp/webhook`;
    return { webhookUrl: url, webhookToken: this.webhookToken, metadata: { installation: 'barber' } };
  }

  /* ---------- estado ---------- */

  async connection(installationId: string) {
    return this.prisma.whatsappConnection.findUnique({ where: { id: 'singleton' } });
  }

  /** Estado atual, conferido no WAHA quando dá. */
  async status(installationId: string) {
    const row = await this.connection(installationId);
    if (!row || !this.waha.enabled) return this.shape(row);
    try {
      const session = await this.waha.session(row.session);
      return this.shape(await this.sync(row, session));
    } catch (error) {
      this.logger.warn(`Estado de ${row.session}: ${error instanceof Error ? error.message : String(error)}`);
      return this.shape(row);
    }
  }

  shape(row: WhatsappConnection | null) {
    return {
      available: this.waha.enabled,
      status: (row?.status ?? 'DESCONECTADO') as WhatsappStatus,
      phone: row?.phone ?? null,
      name: row?.pushName ?? null,
      connectedAt: row?.connectedAt?.toISOString() ?? null,
      lastError: row?.lastError ?? null,
    };
  }

  /** Grava o que o WAHA disse sobre a sessão. */
  async sync(row: WhatsappConnection, session: WahaSession | null, extra: { lastError?: string | null } = {}) {
    let status: WhatsappStatus = session ? mapStatus(session.status) : 'DESCONECTADO';
    // Falha antes de conectar é QR que expirou sem leitura: volta para "conectar", sem religar sozinho.
    const qrExpired = status === 'FALHOU' && !row.connectedAt;
    if (qrExpired) status = 'DESCONECTADO';
    const phone = session?.me?.id ? session.me.id.split('@')[0].replace(/\D/g, '') : null;
    const becameConnected = status === 'CONECTADO' && row.status !== 'CONECTADO';
    const lostDevice = row.status === 'CONECTADO' && status === 'AGUARDANDO_QR';
    const data = {
      status,
      ...(status === 'CONECTADO' ? { phone, pushName: session?.me?.pushName ?? row.pushName, lastError: null } : {}),
      ...(becameConnected ? { connectedAt: new Date() } : {}),
      ...(lostDevice ? { lastError: 'O WhatsApp foi desconectado pelo celular. Conecte de novo para voltar a enviar avisos.' } : {}),
      ...(status === 'FALHOU' && !extra.lastError ? { lastError: 'A conexão caiu. Tentando religar sozinho.' } : {}),
      ...(qrExpired ? { lastError: 'O QR expirou antes da leitura. Clique em Conectar de novo quando estiver com o celular em mãos.' } : {}),
      ...(extra.lastError !== undefined ? { lastError: extra.lastError } : {}),
    };
    const changed = Object.entries(data).some(([key, value]) => {
      const current = (row as Record<string, unknown>)[key];
      return current instanceof Date ? value instanceof Date && current.getTime() !== value.getTime() : current !== value;
    });
    if (!changed) return row;
    if (becameConnected) this.logger.log(`${row.session} conectado como ${phone ?? '?'}`);
    return this.prisma.whatsappConnection.update({ where: { id: row.id }, data });
  }

  /* ---------- conectar e desconectar ---------- */

  /** Cria (ou religa) a sessão da barbearia. Depois o painel mostra o QR ou pede o código. */
  async connect(installationId: string) {
    const session = this.sessionName(installationId);
    const row = await this.prisma.whatsappConnection.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', session, status: 'CONECTANDO' },
      update: { lastError: null },
    });
    const config = this.sessionConfig(installationId);
    let current = await this.waha.session(session);
    if (!current) {
      current = await this.waha.createSession(session, config);
    } else {
      await this.waha.updateSession(session, config).catch(() => undefined);
      if (current.status === 'STOPPED' || current.status === 'FAILED') current = await this.waha.start(session);
    }
    // O WAHA leva uns segundos para chegar no QR: espera até 8 s.
    for (let attempt = 0; attempt < 8 && current.status === 'STARTING'; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      current = (await this.waha.session(session)) ?? current;
    }
    return this.shape(await this.sync(row, current));
  }

  async qr(installationId: string) {
    const row = await this.requireRow(installationId);
    const session = await this.waha.session(row.session);
    await this.sync(row, session);
    if (!session || mapStatus(session.status) !== 'AGUARDANDO_QR') throw new ConflictException('A sessão não está esperando QR. Clique em Conectar de novo.');
    const image = await this.waha.qr(row.session);
    return { image: `data:${image.mimetype};base64,${image.data}` };
  }

  async pairingCode(installationId: string, phone: string) {
    const number = withCountry(phone);
    if (!/^\d{12,13}$/.test(number)) throw new BadRequestException('Informe o WhatsApp da barbearia com DDD.');
    const row = await this.requireRow(installationId);
    const session = await this.waha.session(row.session);
    if (!session || mapStatus(session.status) !== 'AGUARDANDO_QR') throw new ConflictException('A sessão não está esperando conexão. Clique em Conectar de novo.');
    const { code } = await this.waha.requestCode(row.session, number);
    return { code };
  }

  async disconnect(installationId: string) {
    const row = await this.connection(installationId);
    if (!row) return this.shape(null);
    if (this.waha.enabled) {
      await this.waha.logout(row.session).catch((error: unknown) => this.logger.warn(`logout ${row.session}: ${String(error)}`));
      await this.waha.stop(row.session).catch(() => undefined);
    }
    const updated = await this.prisma.whatsappConnection.update({
      where: { id: 'singleton' },
      data: { status: 'DESCONECTADO', phone: null, pushName: null, connectedAt: null, lastError: null },
    });
    return this.shape(updated);
  }

  private async requireRow(installationId: string) {
    const row = await this.connection(installationId);
    if (!row) throw new ConflictException('Clique em Conectar primeiro.');
    return row;
  }

  /* ---------- vigia ---------- */

  /** Religa sessões que já estiveram conectadas e caíram. QR nunca lido não é religado. */
  async watch() {
    if (this.watching) return;
    this.watching = true;
    try {
      const rows = await this.prisma.whatsappConnection.findMany({ where: { connectedAt: { not: null }, status: { in: ['CONECTADO', 'CONECTANDO', 'FALHOU'] } } });
      for (const row of rows) {
        try {
          let session = await this.waha.session(row.session);
          if (!session) {
            // WAHA perdeu a sessão (volume novo): recria; se a credencial sumiu, vai pedir QR.
            session = await this.waha.createSession(row.session, this.sessionConfig('barberos'));
          } else if (session.status === 'STOPPED' || session.status === 'FAILED') {
            this.logger.warn(`${row.session} estava ${session.status}; religando`);
            session = await this.waha.start(row.session);
          }
          await this.sync(row, session);
        } catch (error) {
          const message = error instanceof WahaError ? error.message : String(error);
          this.logger.warn(`Vigia ${row.session}: ${message}`);
        }
      }
    } finally {
      this.watching = false;
    }
  }

  /* ---------- envio ---------- */

  /**
   * Envia um texto pelo número da barbearia e registra no histórico. Com
   * `appointmentId` + `event`, o histórico impede o mesmo aviso duas vezes.
   * Devolve null quando o aviso já tinha sido enviado.
   */
  async send(installationId: string, phone: string, text: string, meta: SendMeta = {}) {
    const number = withCountry(phone);
    let log;
    try {
      log = await this.prisma.whatsappMessage.create({
        data: { appointmentId: meta.appointmentId ?? null, event: meta.event ?? null, phone: number, text },
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') return null;
      throw error;
    }
    const finish = (status: 'ENVIADO' | 'FALHOU', error?: string) =>
      this.prisma.whatsappMessage.update({ where: { id: log.id }, data: { status, error: error ?? null } });

    const row = await this.connection(installationId);
    if (!row || row.status !== 'CONECTADO' || !this.waha.enabled) return finish('FALHOU', 'WhatsApp da barbearia não está conectado.');

    return this.enqueue(row.session, async () => {
      try {
        const chatId = await this.waha.chatIdFor(row.session, number);
        if (!chatId) return finish('FALHOU', 'Esse número não tem WhatsApp.');
        await this.waha.typing(row.session, chatId, true);
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.min(2500, text.length * 15)));
        await this.waha.typing(row.session, chatId, false);
        await this.waha.sendText(row.session, chatId, text);
        return finish('ENVIADO');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Envio ${row.session} para ${number}: ${message}`);
        return finish('FALHOU', message.slice(0, 300));
      }
    });
  }

  /** Uma mensagem por vez por barbearia, com intervalo, para não parecer disparo em massa. */
  private enqueue<T>(session: string, job: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(session) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(async () => {
        const wait = (this.lastSent.get(session) ?? 0) + MIN_GAP_MS + Math.random() * 2000 - Date.now();
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        try {
          return await job();
        } finally {
          this.lastSent.set(session, Date.now());
        }
      });
    this.queues.set(session, next);
    void next.finally(() => {
      if (this.queues.get(session) === next) this.queues.delete(session);
    });
    return next;
  }

  /** Marca a conversa como lida antes de responder (o WhatsApp desconfia de resposta sem leitura). */
  async markSeen(installationId: string, chatId: string) {
    const row = await this.connection(installationId);
    if (row?.status === 'CONECTADO') await this.waha.sendSeen(row.session, chatId);
  }

  async recentMessages(installationId: string) {
    const rows = await this.prisma.whatsappMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return rows.map((row) => ({
      id: row.id,
      event: row.event,
      phone: row.phone,
      text: row.text,
      status: row.status,
      error: row.error,
      appointmentId: row.appointmentId,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
