import { Injectable } from '@nestjs/common';
import { addMinutes, toLocal, zonedToUtc } from '../../agenda/time.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TeamService } from '../../team/team.service.js';
import { ConfigsService } from '../configs/configs.service.js';

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Início da barbearia: o dia de hoje, a receita do mês com os clientes
 * (atendimentos concluídos), próximos atendimentos, equipe e publicação.
 * É a receita da barbearia, não a do SaaS.
 */
@Injectable()
export class OverviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly team: TeamService,
    private readonly configs: ConfigsService,
  ) {}

  async forTenant(installationId: string, now = new Date()) {
    const local = toLocal(now);
    const dayStart = zonedToUtc(local.date, '00:00');
    const dayEnd = addMinutes(dayStart, 24 * 60);
    const [year, month] = local.date.split('-').map(Number);
    const monthStart = zonedToUtc(`${year}-${pad(month)}-01`, '00:00');
    const monthEnd = zonedToUtc(month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`, '00:00');
    const previousStart = zonedToUtc(month === 1 ? `${year - 1}-12-01` : `${year}-${pad(month - 1)}-01`, '00:00');

    const [today, upcoming, monthDone, previousDone, barbers, agendas, customersTotal, customersNew, state] = await Promise.all([
      this.prisma.appointment.findMany({ where: { startsAt: { gte: dayStart, lt: dayEnd } }, select: { status: true, barberId: true, total: true } }),
      this.prisma.appointment.findMany({
        where: { startsAt: { gte: now }, status: { in: ['MARCADO', 'CONFIRMADO'] } },
        orderBy: { startsAt: 'asc' },
        take: 6,
        select: { id: true, barberId: true, customerName: true, startsAt: true, serviceIds: true, status: true, total: true },
      }),
      this.prisma.appointment.aggregate({ where: { status: 'CONCLUIDO', startsAt: { gte: monthStart, lt: monthEnd } }, _sum: { total: true }, _count: true }),
      this.prisma.appointment.aggregate({ where: { status: 'CONCLUIDO', startsAt: { gte: previousStart, lt: monthStart } }, _sum: { total: true }, _count: true }),
      this.team.list(installationId),
      this.prisma.barberAgenda.findMany(),
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { createdAt: { gte: monthStart } } }),
      this.configs.state(installationId),
    ]);

    const config = (state.published ?? state.draft)?.config;
    const services = (config?.services ?? []) as { id: string; name: string }[];
    const serviceName = (id: string) => services.find((service) => service.id === id)?.name ?? id;
    const barberName = (id: string) => barbers.find((barber) => barber.slug === id)?.name ?? id;

    const counts = { total: 0, confirmados: 0, concluidos: 0, faltas: 0, cancelados: 0 };
    let expectedToday = 0;
    const perBarber = new Map<string, number>();
    for (const appointment of today) {
      counts.total += 1;
      // MARCADO é legado: toda reserva vale como confirmada.
      if (appointment.status === 'MARCADO' || appointment.status === 'CONFIRMADO') counts.confirmados += 1;
      else if (appointment.status === 'CONCLUIDO') counts.concluidos += 1;
      else if (appointment.status === 'FALTOU') counts.faltas += 1;
      else counts.cancelados += 1;
      if (appointment.status !== 'CANCELADO' && appointment.status !== 'FALTOU') {
        expectedToday += Number(appointment.total);
        perBarber.set(appointment.barberId, (perBarber.get(appointment.barberId) ?? 0) + 1);
      }
    }

    return {
      date: local.date,
      today: { ...counts, expected: expectedToday },
      revenue: {
        month: Number(monthDone._sum.total ?? 0),
        monthCount: monthDone._count,
        previousMonth: Number(previousDone._sum.total ?? 0),
        previousCount: previousDone._count,
      },
      upcoming: upcoming.map((appointment) => {
        const at = toLocal(appointment.startsAt);
        return {
          id: appointment.id,
          date: at.date,
          time: at.time,
          barberId: appointment.barberId,
          barberName: barberName(appointment.barberId),
          customerName: appointment.customerName,
          services: appointment.serviceIds.map(serviceName),
          status: appointment.status,
          total: Number(appointment.total),
        };
      }),
      barbers: barbers
        .filter((barber) => barber.active)
        .map((barber) => {
          const agenda = agendas.find((row) => row.barberId === barber.slug);
          return { id: barber.slug, name: barber.name, image: barber.image, open: agenda?.open ?? true, closedReason: agenda?.closedReason ?? null, today: perBarber.get(barber.slug) ?? 0 };
        }),
      customers: { total: customersTotal, newThisMonth: customersNew },
      publication: {
        publishedVersion: state.published?.version ?? null,
        publishedAt: state.published?.at ?? null,
        hasDraft: Boolean(state.draft),
      },
    };
  }
}
