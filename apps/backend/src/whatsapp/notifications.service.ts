import { Injectable, Logger, NotFoundException, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '@barber/tenant-config';
import { ConfigsService } from '../admin/configs/configs.service.js';
import { AppointmentEvents, type AppointmentEvent } from '../agenda/appointment-events.js';
import { DEFAULT_TIMEZONE, toLocal } from '../agenda/time.js';
import type { Appointment } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { phoneFromChatId, phoneKey } from './phone.js';
import { DEFAULT_REMINDER_MIN, DEFAULTS, EVENTS, render, type ActiveEvent, type TemplateValues } from './templates.js';
import { WhatsappService } from './whatsapp.service.js';

const REMINDER_EVERY_MS = 60_000;
/** Quem agenda já dentro da janela recebe o pedido de confirmação na hora, se faltar pelo menos isso. */
const LATE_MIN_LEAD_MIN = 20;
/** Resposta ao lembrete só vale para horários até 2 dias à frente. */
const REPLY_WINDOW_MS = 48 * 3600_000;

const CONFIRM = /^(1|sim|s|confirmo|confirmar|confirmado|vou|vou sim|to indo|tô indo|estarei ai|estarei aí)[.!]*$/;
const CANCEL = /^(2|nao|não|n|cancelar|cancela|cancelo|nao vou|não vou)[.!]*$/;

export type TemplateView = { event: ActiveEvent; enabled: boolean; text: string; offsetMin: number | null; custom: boolean; defaultText: string };

/**
 * Avisos da agenda no WhatsApp do cliente: lembrete com "responda 1 ou 2",
 * resposta a quem confirmou, cancelamento, atendido e falta. Reserva feita e
 * confirmação não geram mensagem (a reserva já vale; menos risco ao número). Textos e chaves vêm do
 * painel (`notification_templates`), com padrão no código.
 */
@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Avisos');
  private timer: NodeJS.Timeout | null = null;
  private ticking = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly configs: ConfigsService,
    private readonly events: AppointmentEvents,
    private readonly env: ConfigService,
  ) {}

  onModuleInit() {
    this.events.on((event) => this.onAppointment(event));
    if (!this.whatsapp.waha.enabled) return;
    this.timer = setInterval(() => void this.reminders(), REMINDER_EVERY_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /* ---------- textos ---------- */

  async templates(installationId: string): Promise<TemplateView[]> {
    const rows = await this.prisma.notificationTemplate.findMany();
    return EVENTS.map((event) => {
      const row = rows.find((item) => item.event === event);
      const fallback = DEFAULTS[event];
      return {
        event,
        enabled: row?.enabled ?? fallback.enabled,
        text: row?.text ?? fallback.text,
        offsetMin: event === 'LEMBRETE' ? (row?.offsetMin ?? fallback.offsetMin ?? DEFAULT_REMINDER_MIN) : null,
        custom: Boolean(row),
        defaultText: fallback.text,
      };
    });
  }

  async template(installationId: string, event: ActiveEvent) {
    return (await this.templates(installationId)).find((item) => item.event === event)!;
  }

  async saveTemplate(installationId: string, event: ActiveEvent, input: { enabled: boolean; text: string; offsetMin?: number | null }) {
    const offsetMin = event === 'LEMBRETE' ? (input.offsetMin ?? DEFAULT_REMINDER_MIN) : null;
    await this.prisma.notificationTemplate.upsert({
      where: { event },
      create: { event, enabled: input.enabled, text: input.text.trim(), offsetMin },
      update: { enabled: input.enabled, text: input.text.trim(), offsetMin },
    });
    return this.template(installationId, event);
  }

  async resetTemplate(installationId: string, event: ActiveEvent) {
    await this.prisma.notificationTemplate.deleteMany({ where: { event } });
    return this.template(installationId, event);
  }

  /* ---------- eventos da agenda ---------- */

  private async onAppointment(event: AppointmentEvent) {
    if (!this.whatsapp.waha.enabled) return;
    // Reserva feita não gera mensagem: o cliente acabou de ver a confirmação na tela.
    if (event.type === 'criado') return;
    const map: Partial<Record<string, ActiveEvent>> = { CANCELADO: 'CANCELADO', CONCLUIDO: 'CONCLUIDO', FALTOU: 'FALTOU' };
    const notification = map[event.status];
    if (notification) return this.dispatch(event.installationId, event.appointmentId, notification);
  }

  /** Manda um aviso de um atendimento, se o WhatsApp está conectado e o aviso ligado. */
  async dispatch(installationId: string, appointmentId: string, event: ActiveEvent) {
    const connection = await this.whatsapp.connection(installationId);
    if (connection?.status !== 'CONECTADO') return null;
    const template = await this.template(installationId, event);
    if (!template.enabled || !template.text.trim()) return null;
    const appointment = await this.prisma.appointment.findFirst({ where: { id: appointmentId } });
    if (!appointment) return null;

    const now = Date.now();
    const starts = appointment.startsAt.getTime();
    // Atendimento lançado no passado pelo painel não gera aviso de reserva.
    if (['LEMBRETE', 'CANCELADO'].includes(event) && starts < now) return null;
    if (['CONCLUIDO', 'FALTOU'].includes(event) && now - starts > 24 * 3600_000) return null;

    const text = render(template.text, await this.values(installationId, appointment));
    return this.whatsapp.send(installationId, appointment.customerPhone, text, { appointmentId, event });
  }

  /** Valores das variáveis para um atendimento. */
  async values(installationId: string, appointment: Appointment): Promise<TemplateValues> {
    const [config, tenant] = await Promise.all([this.config(installationId), this.prisma.installation.findUnique({ where: { id: installationId }, select: { slug: true } })]);
    const barber = config.barbers.find((item) => item.id === appointment.barberId);
    const services = appointment.serviceIds.map((id) => config.services.find((item) => item.id === id)?.name ?? id);
    const local = toLocal(appointment.startsAt, DEFAULT_TIMEZONE);
    const today = toLocal(new Date(), DEFAULT_TIMEZONE).date;
    const tomorrow = toLocal(new Date(Date.now() + 86_400_000), DEFAULT_TIMEZONE).date;
    const date = shortDate(appointment.startsAt);
    const when = local.date === today ? `hoje às ${local.time}` : local.date === tomorrow ? `amanhã às ${local.time}` : `${date} às ${local.time}`;
    const address = config.address ? [config.address.street, config.address.district].filter(Boolean).join(' - ') : '';
    return {
      nome: appointment.customerName.trim().split(/\s+/)[0] ?? appointment.customerName,
      barbearia: config.name,
      barbeiro: barber?.name ?? 'seu barbeiro',
      servicos: joinNames(services),
      data: date,
      hora: local.time,
      quando: when,
      valor: Number(appointment.total.toString()).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      codigo: appointment.cancelCode,
      endereco: address,
      link: tenant ? this.appUrl(tenant.slug) : '',
    };
  }

  private appUrl(slug: string) {
    const platform = this.env.get<string>('PLATFORM_DOMAIN', 'localhost').toLowerCase();
    return `https://${slug}.${platform}`;
  }

  private async config(installationId: string): Promise<AppConfig> {
    const state = await this.configs.state(installationId);
    const version = state.published ?? state.draft;
    if (!version) throw new NotFoundException('Barbearia sem configuração.');
    return version.config;
  }

  /* ---------- lembretes ---------- */

  /**
   * A cada minuto: lembrete com "responda 1 ou 2" para quem está dentro da
   * janela e ainda não recebeu. Quem agendou já dentro da janela (ex.: marcou
   * para daqui a 1 h com lembrete de 3 h) recebe no minuto seguinte à reserva,
   * desde que falte pelo menos 20 min; mais perto que isso, a pessoa já está
   * a caminho e não recebe nada.
   */
  async reminders() {
    if (this.ticking) return;
    this.ticking = true;
    try {
      const connected = await this.prisma.whatsappConnection.findMany({ where: { status: 'CONECTADO' }, select: { id: true } });
      const now = new Date();
      for (const _row of connected) {
        const installationId = 'barberos';
        const template = await this.template(installationId, 'LEMBRETE');
        if (!template.enabled) continue;
        const offset = template.offsetMin ?? DEFAULT_REMINDER_MIN;
        const due = await this.prisma.appointment.findMany({
          where: {
            installationId,
            status: { in: ['MARCADO', 'CONFIRMADO'] },
            reminderSentAt: null,
            startsAt: { gt: new Date(now.getTime() + 5 * 60_000), lte: new Date(now.getTime() + offset * 60_000) },
          },
          orderBy: { startsAt: 'asc' },
          take: 30,
        });
        for (const appointment of due) {
          await this.prisma.appointment.update({ where: { id: appointment.id }, data: { reminderSentAt: now } });
          const bookedLate = appointment.createdAt.getTime() > appointment.startsAt.getTime() - offset * 60_000;
          if (bookedLate && appointment.startsAt.getTime() - now.getTime() < LATE_MIN_LEAD_MIN * 60_000) continue;
          await this.dispatch(installationId, appointment.id, 'LEMBRETE').catch((error: unknown) => this.logger.warn(`Lembrete ${appointment.id}: ${String(error)}`));
        }
      }
    } catch (error) {
      this.logger.warn(`Lembretes: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.ticking = false;
    }
  }

  /* ---------- respostas do cliente ---------- */

  /**
   * Mensagem recebida no número da barbearia. Só age quando é resposta a um
   * lembrete enviado ("1" confirma a ida, "2" cancela); qualquer outra conversa
   * fica para a barbearia responder no celular.
   */
  async incoming(installationId: string, input: { chatId: string; body: string; phone: string | null }) {
    const intent = replyIntent(input.body);
    if (!intent || !input.phone) return;

    const key = phoneKey(input.phone);
    const now = Date.now();
    const reminded = await this.prisma.whatsappMessage.findMany({
      where: { event: 'LEMBRETE', status: 'ENVIADO', createdAt: { gte: new Date(now - REPLY_WINDOW_MS) } },
      select: { appointmentId: true, phone: true },
    });
    const ids = reminded.filter((item) => item.appointmentId && phoneKey(item.phone) === key).map((item) => item.appointmentId!);
    if (ids.length === 0) return;
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: { in: ids }, status: { in: ['MARCADO', 'CONFIRMADO'] }, customerConfirmedAt: null, startsAt: { gt: new Date(now - 30 * 60_000) } },
      orderBy: { startsAt: 'asc' },
    });
    if (!appointment) return;

    await this.whatsapp.markSeen(installationId, input.chatId);
    if (intent === 'confirmar') {
      await this.prisma.appointment.update({ where: { id: appointment.id }, data: { customerConfirmedAt: new Date() } });
      this.logger.log(`Cliente confirmou a ida: ${appointment.id}`);
      await this.dispatch(installationId, appointment.id, 'CLIENTE_CONFIRMOU');
      return;
    }
    await this.prisma.appointment.update({ where: { id: appointment.id }, data: { status: 'CANCELADO', cancelledAt: new Date() } });
    this.logger.log(`Cliente cancelou pelo WhatsApp: ${appointment.id}`);
    await this.dispatch(installationId, appointment.id, 'CANCELADO');
  }

  /** Webhook do WAHA já validado. */
  async handleWebhook(body: WahaWebhook) {
    const row = body.session ? await this.prisma.whatsappConnection.findUnique({ where: { session: body.session } }) : null;
    if (!row) return;
    if (body.event === 'session.status') {
      const status = body.payload?.status;
      if (typeof status !== 'string') return;
      const session = await this.whatsapp.waha.session(row.session).catch(() => null);
      await this.whatsapp.sync(row, session ?? { name: row.session, status: status as never, me: null });
      return;
    }
    if (body.event !== 'message') return;
    const payload = body.payload ?? {};
    if (payload.fromMe || typeof payload.from !== 'string' || typeof payload.body !== 'string') return;
    const chatId = payload.from;
    if (!chatId.endsWith('@c.us') && !chatId.endsWith('@lid') && !chatId.endsWith('@s.whatsapp.net')) return;
    let phone = phoneFromChatId(chatId);
    if (!phone && chatId.endsWith('@lid')) {
      const pn = await this.whatsapp.waha.phoneForLid(row.session, chatId);
      phone = pn ? phoneFromChatId(pn) : null;
    }
    await this.incoming('barberos', { chatId, body: payload.body, phone });
  }
}

export type WahaWebhook = {
  event?: string;
  session?: string;
  payload?: { status?: unknown; from?: unknown; body?: unknown; fromMe?: unknown };
};

/** "1"/"sim" confirma, "2"/"não" cancela; o resto é conversa comum. */
export function replyIntent(text: string): 'confirmar' | 'cancelar' | null {
  const answer = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return CONFIRM.test(answer) ? 'confirmar' : CANCEL.test(answer) ? 'cancelar' : null;
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/** "sex, 19/09" no fuso da barbearia. */
function shortDate(at: Date) {
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: DEFAULT_TIMEZONE }).format(at).replace('.', '');
  const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: DEFAULT_TIMEZONE }).format(at);
  return `${weekday}, ${day}`;
}
