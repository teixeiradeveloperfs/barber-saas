import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { referralRewardLabel, type ReferralReward, type AppConfig } from '@barber/tenant-config';
import { AppointmentEvents } from '../agenda/appointment-events.js';
import type { Customer } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { referralCode, rewardDiscount } from './referral-rules.js';

type ConfigLike = Pick<AppConfig, 'referral' | 'services'>;

/**
 * Indicação de clientes da barbearia: cada cliente tem um código; quem cria
 * a conta pelo link ganha a recompensa de "indicado" na hora, e quem indicou
 * ganha a dele quando o amigo conclui o primeiro atendimento. Recompensas são
 * cupons reais (`customer_rewards`), abatidos no valor do agendamento.
 */
@Injectable()
export class ReferralsService implements OnModuleInit {
  private readonly logger = new Logger('Indicação');

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: AppointmentEvents,
  ) {}

  onModuleInit() {
    this.events.on(async (event) => {
      if (event.type !== 'status') return;
      if (event.status === 'CONCLUIDO') await this.completeFor(event.installationId, event.appointmentId);
      if (event.status === 'CANCELADO') await this.releaseFor(event.appointmentId);
    });
  }

  /* ---------- código ---------- */

  async codeFor(customer: Customer) {
    if (customer.referralCode) return customer.referralCode;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = referralCode(customer.name);
      try {
        await this.prisma.customer.update({ where: { id: customer.id }, data: { referralCode: code } });
        return code;
      } catch (error) {
        if ((error as { code?: string }).code !== 'P2002') throw error;
      }
    }
    throw new ConflictException('Não foi possível gerar o código de indicação.');
  }

  /** Prévia pública do link: de quem é e o que o amigo ganha. */
  async preview(installationId: string, config: ConfigLike, code: string) {
    if (!config.referral.enabled) throw new NotFoundException('Indicação desligada.');
    const referrer = await this.prisma.customer.findUnique({ where: { referralCode: code.trim().toUpperCase() }, select: { name: true } });
    if (!referrer) throw new NotFoundException('Código de indicação não encontrado.');
    return { referrerName: referrer.name.trim().split(/\s+/)[0], reward: referralRewardLabel(config.referral.referred, config.services), headline: config.referral.headline };
  }

  /* ---------- cadastro ---------- */

  /** Conta nova com código: registra a indicação e dá a recompensa do amigo. Nunca derruba o cadastro. */
  async attach(installationId: string, config: ConfigLike, customer: Customer, code: string | null | undefined) {
    if (!code || !config.referral.enabled) return;
    try {
      const referrer = await this.prisma.customer.findUnique({ where: { referralCode: code.trim().toUpperCase() } });
      if (!referrer || referrer.id === customer.id) return;
      // Mesmo WhatsApp de quem indicou: é a mesma pessoa.
      if (referrer.phone && customer.phone && referrer.phone === customer.phone) return;
      const referral = await this.prisma.customerReferral.create({ data: { referrerId: referrer.id, referredId: customer.id } });
      await this.grant(installationId, config, customer.id, referral.id, 'INDICADO', config.referral.referred);
      this.logger.log(`${customer.name} chegou pela indicação de ${referrer.name}`);
    } catch (error) {
      this.logger.warn(`Indicação no cadastro: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async grant(installationId: string, config: ConfigLike, customerId: string, referralId: string, source: 'INDICOU' | 'INDICADO', reward: ReferralReward) {
    const label = referralRewardLabel(reward, config.services);
    if (!label) return null;
    return this.prisma.customerReward.create({
      data: {
        customerId,
        referralId,
        source,
        kind: reward.kind,
        value: reward.value,
        serviceId: reward.kind === 'servico_gratis' ? (reward.serviceId ?? null) : null,
        label,
        expiresAt: reward.validDays > 0 ? new Date(Date.now() + reward.validDays * 86_400_000) : null,
      },
    });
  }

  /* ---------- primeiro atendimento ---------- */

  /** Amigo atendido pela primeira vez: indicação concluída e quem indicou ganha. */
  private async completeFor(installationId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId }, select: { customerId: true } });
    if (!appointment?.customerId) return;
    const referral = await this.prisma.customerReferral.findUnique({ where: { referredId: appointment.customerId } });
    if (!referral || referral.status !== 'PENDENTE') return;
    const claimed = await this.prisma.customerReferral.updateMany({ where: { id: referral.id, status: 'PENDENTE' }, data: { status: 'CONCLUIDA', completedAt: new Date() } });
    if (claimed.count === 0) return;
    const config = await this.config(installationId);
    if (!config?.referral.enabled) return;
    if (config.referral.monthlyLimit > 0) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const earned = await this.prisma.customerReward.count({ where: { customerId: referral.referrerId, source: 'INDICOU', createdAt: { gte: monthStart } } });
      if (earned >= config.referral.monthlyLimit) return;
    }
    await this.grant(installationId, config, referral.referrerId, referral.id, 'INDICOU', config.referral.referrer);
  }

  private async config(installationId: string): Promise<ConfigLike | null> {
    const row = await this.prisma.appConfig.findFirst({ where: { published: true }, orderBy: { version: 'desc' } });
    return (row?.config as unknown as ConfigLike) ?? null;
  }

  /* ---------- uso no agendamento ---------- */

  /** Expira as vencidas e devolve as disponíveis do cliente. */
  async available(installationId: string, customerId: string) {
    await this.prisma.customerReward.updateMany({ where: { customerId, status: 'DISPONIVEL', expiresAt: { lt: new Date() } }, data: { status: 'EXPIRADO' } });
    return this.prisma.customerReward.findMany({ where: { customerId, status: 'DISPONIVEL' }, orderBy: { createdAt: 'asc' } });
  }

  /**
   * Reserva a recompensa para um agendamento: calcula o desconto e já marca
   * como usada (condicional, para não usar duas vezes). Devolve o desconto.
   */
  async claim(installationId: string, config: ConfigLike, customerId: string, rewardId: string, serviceIds: string[], coveredIds: string[]) {
    const reward = (await this.available(installationId, customerId)).find((item) => item.id === rewardId);
    if (!reward) throw new BadRequestException('Recompensa indisponível. Atualize e tente de novo.');
    const covered = new Set(coveredIds);
    const lines = serviceIds.map((id) => ({ id, price: config.services.find((service) => service.id === id)?.price ?? 0, covered: covered.has(id) }));
    const total = lines.filter((line) => !line.covered).reduce((sum, line) => sum + line.price, 0);
    const { discount, error } = rewardDiscount({ kind: reward.kind, value: Number(reward.value), serviceId: reward.serviceId }, lines, total);
    if (error) throw new BadRequestException(error);
    const taken = await this.prisma.customerReward.updateMany({ where: { id: reward.id, status: 'DISPONIVEL' }, data: { status: 'USADO', usedAt: new Date() } });
    if (taken.count === 0) throw new BadRequestException('Recompensa já usada.');
    return { rewardId: reward.id, discount, label: reward.label };
  }

  async attachToAppointment(rewardId: string, appointmentId: string) {
    await this.prisma.customerReward.update({ where: { id: rewardId }, data: { appointmentId } });
  }

  /** Reserva não saiu (erro) ou foi cancelada: a recompensa volta, se ainda vale. */
  async release(rewardId: string) {
    await this.prisma.customerReward.updateMany({ where: { id: rewardId, status: 'USADO' }, data: { status: 'DISPONIVEL', usedAt: null, appointmentId: null } });
  }

  private async releaseFor(appointmentId: string) {
    const reward = await this.prisma.customerReward.findFirst({ where: { appointmentId, status: 'USADO' } });
    if (reward) await this.release(reward.id);
  }

  /* ---------- telas ---------- */

  /** "Indique e ganhe" do cliente. */
  async me(installationId: string, config: ConfigLike, customer: Customer) {
    const [code, referrals, rewards] = await Promise.all([
      this.codeFor(customer),
      this.prisma.customerReferral.findMany({ where: { referrerId: customer.id }, include: { referred: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.available(installationId, customer.id),
    ]);
    return {
      enabled: config.referral.enabled,
      headline: config.referral.headline,
      code,
      youGet: referralRewardLabel(config.referral.referrer, config.services),
      friendGets: referralRewardLabel(config.referral.referred, config.services),
      referrals: referrals.map((row) => ({ name: row.referred.name.trim().split(/\s+/)[0], status: row.status, createdAt: row.createdAt, completedAt: row.completedAt })),
      rewards: rewards.map((row) => ({ id: row.id, label: row.label, source: row.source, kind: row.kind, value: Number(row.value), serviceId: row.serviceId, expiresAt: row.expiresAt })),
    };
  }

  /** Resumo para o painel da barbearia. */
  async summary(installationId: string) {
    const [total, done, rewardsUsed, recent] = await Promise.all([
      this.prisma.customerReferral.count(),
      this.prisma.customerReferral.count({ where: { status: 'CONCLUIDA' } }),
      this.prisma.customerReward.count({ where: { status: 'USADO' } }),
      this.prisma.customerReferral.findMany({ include: { referrer: { select: { name: true } }, referred: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    return {
      total,
      done,
      rewardsUsed,
      recent: recent.map((row) => ({ id: row.id, referrer: row.referrer.name, referred: row.referred.name, status: row.status, createdAt: row.createdAt, completedAt: row.completedAt })),
    };
  }
}
