import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AppConfig } from '@barber/tenant-config';
import { randomBytes } from 'node:crypto';
import type { AppointmentSource, AppointmentStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AppointmentEvents } from './appointment-events.js';
import { addMinutes, DEFAULT_TIMEZONE, overlaps, toLocal, weekdayOf, zonedToUtc } from './time.js';

/** Passo entre horários oferecidos e folga mínima para reservar hoje. */
export const SLOT_STEP_MIN = 30;
export const BOOKING_CUTOFF_MIN = 30;

/** Estados que ocupam horário na agenda. */
const OCCUPYING: AppointmentStatus[] = ['MARCADO', 'CONFIRMADO', 'CONCLUIDO'];

export type Slot = { time: string; available: boolean; reason?: 'passou' | 'ocupado' | 'bloqueado' };

export type BookingInput = {
  barberId: string;
  serviceIds: string[];
  coveredServiceIds?: string[];
  date: string;
  time: string;
  customer: { name: string; phone: string };
  notes?: string;
};

type Actor = { id: string; role: 'PLATAFORMA' | 'DONO' | 'GESTOR' | 'BARBEIRO'; barberId: string | null };

@Injectable()
export class AgendaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: AppointmentEvents,
  ) {}

  private readonly timeZone = DEFAULT_TIMEZONE;

  /* ---------- leitura pública ---------- */

  /** Horários de um barbeiro em um dia, já descontando reservas, bloqueios e agenda trancada. */
  async slots(installationId: string, config: AppConfig, barberId: string, date: string, durationMin: number, now = new Date()) {
    const barber = config.barbers.find((item) => item.id === barberId);
    if (!barber) throw new NotFoundException('Barbeiro não encontrado.');

    const hours = config.hours.find((item) => item.day === weekdayOf(date, this.timeZone));
    if (!hours?.open || !hours.close) return { date, barberId, open: true, closed: true, slots: [] as Slot[] };

    const agenda = await this.prisma.barberAgenda.findUnique({ where: { barberId } });
    if (agenda && !agenda.open) return { date, barberId, open: false, closed: false, closedReason: agenda.closedReason, slots: [] as Slot[] };

    const dayStart = zonedToUtc(date, hours.open, this.timeZone);
    const dayEnd = zonedToUtc(date, hours.close, this.timeZone);
    const [appointments, blocks] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { barberId, status: { in: OCCUPYING }, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
        select: { startsAt: true, endsAt: true },
      }),
      this.prisma.agendaBlock.findMany({
        where: { OR: [{ barberId: null }, { barberId }], startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
        select: { startsAt: true, endsAt: true },
      }),
    ]);

    const cutoff = addMinutes(now, BOOKING_CUTOFF_MIN);
    const slots: Slot[] = [];
    for (let at = dayStart; addMinutes(at, durationMin) <= dayEnd; at = addMinutes(at, SLOT_STEP_MIN)) {
      const end = addMinutes(at, durationMin);
      let reason: Slot['reason'];
      if (at < cutoff) reason = 'passou';
      else if (appointments.some((item) => overlaps(at, end, item.startsAt, item.endsAt))) reason = 'ocupado';
      else if (blocks.some((item) => overlaps(at, end, item.startsAt, item.endsAt))) reason = 'bloqueado';
      slots.push({ time: toLocal(at, this.timeZone).time, available: !reason, ...(reason ? { reason } : {}) });
    }
    return { date, barberId, open: true, closed: false, slots };
  }

  /* ---------- reserva ---------- */

  async book(
    installationId: string,
    config: AppConfig,
    input: BookingInput,
    source: AppointmentSource,
    options: { skipCutoff?: boolean; customerId?: string | null; discount?: { amount: number; label: string } | null } = {},
  ) {
    const barber = config.barbers.find((item) => item.id === input.barberId);
    if (!barber) throw new NotFoundException('Barbeiro não encontrado.');
    const services = input.serviceIds.map((id) => {
      const service = config.services.find((item) => item.id === id);
      if (!service) throw new NotFoundException(`Serviço "${id}" não encontrado.`);
      return service;
    });
    const covered = new Set(input.coveredServiceIds ?? []);
    const durationMin = services.reduce((sum, service) => sum + service.durationMin, 0);
    const gross = services.filter((service) => !covered.has(service.id)).reduce((sum, service) => sum + service.price, 0);
    const discount = Math.min(gross, options.discount?.amount ?? 0);
    const total = Math.round((gross - discount) * 100) / 100;

    const hours = config.hours.find((item) => item.day === weekdayOf(input.date, this.timeZone));
    if (!hours?.open || !hours.close) throw new BadRequestException('A barbearia não abre neste dia.');
    const startsAt = zonedToUtc(input.date, input.time, this.timeZone);
    const endsAt = addMinutes(startsAt, durationMin);
    const dayStart = zonedToUtc(input.date, hours.open, this.timeZone);
    const dayEnd = zonedToUtc(input.date, hours.close, this.timeZone);
    if (startsAt < dayStart || endsAt > dayEnd) throw new BadRequestException('Horário fora do funcionamento da barbearia.');
    if (!options.skipCutoff && startsAt < addMinutes(new Date(), BOOKING_CUTOFF_MIN)) {
      throw new BadRequestException('Esse horário já passou. Escolha outro.');
    }

    const agenda = await this.prisma.barberAgenda.findUnique({ where: { barberId: barber.id } });
    if (agenda && !agenda.open) throw new ConflictException(`A agenda de ${barber.name} está fechada no momento.`);

    const [conflict, block] = await Promise.all([
      this.prisma.appointment.findFirst({
        where: { barberId: barber.id, status: { in: OCCUPYING }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
        select: { id: true },
      }),
      this.prisma.agendaBlock.findFirst({
        where: { OR: [{ barberId: null }, { barberId: barber.id }], startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
        select: { id: true, reason: true },
      }),
    ]);
    if (conflict) throw new ConflictException('Esse horário acabou de ser reservado. Escolha outro.');
    if (block) throw new ConflictException(block.reason ? `Horário bloqueado: ${block.reason}.` : 'Horário bloqueado pela barbearia.');

    const appointment = await this.prisma.appointment.create({
      data: {
        
        barberId: barber.id,
        serviceIds: services.map((service) => service.id),
        coveredServiceIds: Array.from(covered),
        customerName: input.customer.name.trim(),
        customerPhone: input.customer.phone.replace(/\D/g, ''),
        startsAt,
        endsAt,
        durationMin,
        total,
        source,
        notes: input.notes?.trim() || null,
        cancelCode: cancelCode(),
        customerId: options.customerId ?? null,
        discount,
        rewardLabel: discount > 0 ? (options.discount?.label ?? null) : null,
      },
    });
    this.events.emit({ type: 'criado', installationId, appointmentId: appointment.id });
    return this.shape(appointment);
  }

  /** Reservas do cliente logado: as feitas com a conta e as feitas antes só com o mesmo WhatsApp. */
  async listMine(installationId: string, customer: { id: string; phone: string | null }) {
    const rows = await this.prisma.appointment.findMany({
      where: { OR: [{ customerId: customer.id }, ...(customer.phone ? [{ customerPhone: customer.phone }] : [])] },
      orderBy: { startsAt: 'desc' },
      take: 200,
    });
    // Vincula de vez as reservas antigas feitas pelo mesmo telefone.
    const orphans = rows.filter((row) => !row.customerId).map((row) => row.id);
    if (orphans.length) await this.prisma.appointment.updateMany({ where: { id: { in: orphans } }, data: { customerId: customer.id } });
    return rows.map((row) => this.shape({ ...row, customerId: customer.id }));
  }

  async cancelMine(installationId: string, customer: { id: string; phone: string | null }, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id: appointmentId, OR: [{ customerId: customer.id }, ...(customer.phone ? [{ customerPhone: customer.phone }] : [])] } });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado.');
    if (!['MARCADO', 'CONFIRMADO'].includes(appointment.status)) throw new ConflictException('Esse agendamento não pode mais ser cancelado.');
    const updated = await this.prisma.appointment.update({ where: { id: appointment.id }, data: { status: 'CANCELADO', cancelledAt: new Date() } });
    this.events.emit({ type: 'status', installationId, appointmentId: appointment.id, status: 'CANCELADO', by: 'cliente' });
    return this.shape(updated);
  }

  async byCode(installationId: string, code: string) {
    const appointment = await this.prisma.appointment.findFirst({ where: { cancelCode: code.trim().toUpperCase() } });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado.');
    return this.shape(appointment);
  }

  /** Cancelamento pelo cliente, com o código recebido na reserva. */
  async cancelByCode(installationId: string, code: string) {
    const appointment = await this.prisma.appointment.findFirst({ where: { cancelCode: code.trim().toUpperCase() } });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado.');
    if (!['MARCADO', 'CONFIRMADO'].includes(appointment.status)) {
      throw new ConflictException('Esse agendamento não pode mais ser cancelado.');
    }
    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELADO', cancelledAt: new Date() },
    });
    this.events.emit({ type: 'status', installationId, appointmentId: appointment.id, status: 'CANCELADO', by: 'cliente' });
    return this.shape(updated);
  }

  /* ---------- painel ---------- */

  async list(installationId: string, actor: Actor, filter: { from: Date; to: Date; barberId?: string; status?: AppointmentStatus }) {
    const barberId = actor.role === 'BARBEIRO' ? (actor.barberId ?? '__sem_barbeiro__') : filter.barberId;
    const rows = await this.prisma.appointment.findMany({
      where: {
        
        startsAt: { lt: filter.to },
        endsAt: { gt: filter.from },
        ...(barberId ? { barberId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      },
      orderBy: { startsAt: 'asc' },
    });
    return rows.map((row) => this.shape(row));
  }

  async updateStatus(installationId: string, actor: Actor, appointmentId: string, input: { status?: AppointmentStatus; notes?: string }) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado.');
    if (actor.role === 'BARBEIRO') {
      if (appointment.barberId !== actor.barberId) throw new ForbiddenException('Esse atendimento não é seu.');
      if (input.status && !['CONFIRMADO', 'CONCLUIDO', 'FALTOU'].includes(input.status)) {
        throw new ForbiddenException('Barbeiro só confirma, conclui ou marca falta.');
      }
    }
    if (input.status === 'CANCELADO' && ['CONCLUIDO', 'FALTOU'].includes(appointment.status)) {
      throw new ConflictException('Atendimento já encerrado não pode ser cancelado.');
    }
    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        ...(input.status ? { status: input.status, cancelledAt: input.status === 'CANCELADO' ? new Date() : appointment.cancelledAt } : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
      },
    });
    if (input.status && input.status !== appointment.status) {
      this.events.emit({ type: 'status', installationId, appointmentId: appointment.id, status: input.status, by: 'barbearia' });
    }
    return this.shape(updated);
  }

  async listBlocks(installationId: string, from: Date, to: Date) {
    return this.prisma.agendaBlock.findMany({ where: { startsAt: { lt: to }, endsAt: { gt: from } }, orderBy: { startsAt: 'asc' } });
  }

  async addBlock(installationId: string, config: AppConfig, actorId: string, input: { barberId?: string | null; startsAt: Date; endsAt: Date; reason?: string }) {
    if (input.endsAt <= input.startsAt) throw new BadRequestException('O fim precisa ser depois do início.');
    if (input.barberId && !config.barbers.some((item) => item.id === input.barberId)) throw new NotFoundException('Barbeiro não encontrado.');
    return this.prisma.agendaBlock.create({
      data: { barberId: input.barberId ?? null, startsAt: input.startsAt, endsAt: input.endsAt, reason: input.reason?.trim() || null, createdBy: actorId },
    });
  }

  async removeBlock(installationId: string, blockId: string) {
    const block = await this.prisma.agendaBlock.findFirst({ where: { id: blockId } });
    if (!block) throw new NotFoundException('Bloqueio não encontrado.');
    await this.prisma.agendaBlock.delete({ where: { id: blockId } });
    return { ok: true as const };
  }

  /** Estado da agenda de cada barbeiro da equipe. */
  async barbers(installationId: string, config: AppConfig) {
    const rows = await this.prisma.barberAgenda.findMany();
    return config.barbers.map((barber) => {
      const state = rows.find((row) => row.barberId === barber.id);
      return { id: barber.id, name: barber.name, image: barber.image, open: state?.open ?? true, closedReason: state?.closedReason ?? null };
    });
  }

  async setBarberAgenda(installationId: string, config: AppConfig, barberId: string, input: { open: boolean; reason?: string }) {
    if (!config.barbers.some((item) => item.id === barberId)) throw new NotFoundException('Barbeiro não encontrado.');
    const row = await this.prisma.barberAgenda.upsert({
      where: { barberId },
      create: { barberId, open: input.open, closedReason: input.open ? null : input.reason?.trim() || null },
      update: { open: input.open, closedReason: input.open ? null : input.reason?.trim() || null },
    });
    return { barberId, open: row.open, closedReason: row.closedReason };
  }

  /* ---------- util ---------- */

  private shape(row: {
    id: string;
    barberId: string;
    serviceIds: string[];
    coveredServiceIds: string[];
    customerName: string;
    customerPhone: string;
    startsAt: Date;
    endsAt: Date;
    durationMin: number;
    total: { toString(): string };
    status: AppointmentStatus;
    source: AppointmentSource;
    notes: string | null;
    cancelCode: string;
    cancelledAt: Date | null;
    createdAt: Date;
    customerId?: string | null;
    customerConfirmedAt?: Date | null;
    discount?: { toString(): string };
    rewardLabel?: string | null;
  }) {
    const local = toLocal(row.startsAt, this.timeZone);
    return {
      id: row.id,
      barberId: row.barberId,
      serviceIds: row.serviceIds,
      coveredServiceIds: row.coveredServiceIds,
      customer: { name: row.customerName, phone: row.customerPhone },
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      date: local.date,
      time: local.time,
      durationMin: row.durationMin,
      total: Number(row.total.toString()),
      status: row.status,
      source: row.source,
      notes: row.notes,
      cancelCode: row.cancelCode,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      customerId: row.customerId ?? null,
      /** Cliente respondeu ao lembrete do WhatsApp confirmando que vai. */
      customerConfirmedAt: row.customerConfirmedAt?.toISOString() ?? null,
      /** Desconto de recompensa já abatido do total. */
      discount: row.discount ? Number(row.discount.toString()) : 0,
      rewardLabel: row.rewardLabel ?? null,
    };
  }
}

/** Código curto e legível para o cliente: 8 caracteres sem 0/O e 1/I. */
function cancelCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(randomBytes(8), (byte) => alphabet[byte % alphabet.length]).join('');
}
