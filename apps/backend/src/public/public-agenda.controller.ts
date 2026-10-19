import { Body, Controller, Get, Header, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { Customer } from '../generated/prisma/client.js';
import { CurrentCustomer, CustomerGuard, OptionalCustomerGuard } from '../customers/customer.guard.js';
import { z } from 'zod';
import { AgendaService } from '../agenda/agenda.service.js';
import { isDateString, isTimeString } from '../agenda/time.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ReferralsService } from '../referrals/referrals.service.js';
import { currentInstallation } from '../tenants/tenant-context.js';

const date = z.string().refine(isDateString, 'Data no formato AAAA-MM-DD.');
const time = z.string().refine(isTimeString, 'Hora no formato HH:MM.');
const phone = z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().regex(/^\d{10,15}$/, 'Informe o WhatsApp com DDD.'));

const bookSchema = z.object({
  barberId: z.string().min(1),
  serviceIds: z.array(z.string().min(1)).min(1, 'Escolha pelo menos um serviço.'),
  coveredServiceIds: z.array(z.string()).optional(),
  date,
  time,
  customer: z.object({ name: z.string().trim().min(2, 'Informe seu nome.'), phone }).optional(),
  notes: z.string().max(280).optional(),
  /** Recompensa (indicação) a usar nesta reserva. Só logado. */
  rewardId: z.string().optional(),
});

/** Agenda vista pelo cliente: horários livres, reserva, consulta e cancelamento por código. */
@Controller('public/agenda')
export class PublicAgendaController {
  constructor(
    private readonly agenda: AgendaService,
    private readonly referrals: ReferralsService,
  ) {}

  @Get('slots')
  @Header('Cache-Control', 'no-store')
  slots(@Query('barber') barberId = '', @Query('date') day = '', @Query('duration') duration = '30') {
    const tenant = requireTenant();
    if (!barberId) throw new NotFoundException('Informe o barbeiro.');
    if (!isDateString(day)) throw new NotFoundException('Data inválida.');
    const durationMin = Math.max(5, Math.min(480, Number(duration) || 30));
    return this.agenda.slots(tenant.id, tenant.config, barberId, day, durationMin);
  }

  /** Reserva. Logado, fica na conta (nome e WhatsApp da conta prevalecem); anônimo, só com o código. */
  @Post('appointments')
  @UseGuards(OptionalCustomerGuard)
  async book(@CurrentCustomer() customer: Customer | null, @Body(new ZodValidationPipe(bookSchema)) body: z.infer<typeof bookSchema>) {
    const tenant = requireTenant();
    if (!customer && !body.customer) throw new NotFoundException('Informe nome e WhatsApp ou entre na sua conta.');
    // Logado: nome da conta; WhatsApp da conta se houver, senão o informado no formulário.
    const phone = customer ? (customer.phone ?? body.customer?.phone) : body.customer!.phone;
    if (!phone) throw new NotFoundException('Informe um WhatsApp para a barbearia falar com você sobre o horário.');
    const { rewardId, ...rest } = body;
    const input = customer ? { ...rest, customer: { name: customer.name, phone } } : { ...rest, customer: body.customer! };
    if (!rewardId) return this.agenda.book(tenant.id, tenant.config, input, 'APP', { customerId: customer?.id ?? null });
    if (!customer) throw new NotFoundException('Entre na sua conta para usar a recompensa.');
    // Reserva a recompensa antes (não usa duas vezes); se a reserva falhar, devolve.
    const claim = await this.referrals.claim(tenant.id, tenant.config, customer.id, rewardId, body.serviceIds, body.coveredServiceIds ?? []);
    try {
      const appointment = await this.agenda.book(tenant.id, tenant.config, input, 'APP', { customerId: customer.id, discount: { amount: claim.discount, label: claim.label } });
      await this.referrals.attachToAppointment(claim.rewardId, appointment.id);
      return appointment;
    } catch (error) {
      await this.referrals.release(claim.rewardId);
      throw error;
    }
  }

  @Get('mine')
  @UseGuards(CustomerGuard)
  @Header('Cache-Control', 'no-store')
  mine(@CurrentCustomer() customer: Customer) {
    const tenant = requireTenant();
    return this.agenda.listMine(tenant.id, customer);
  }

  @Post('mine/:appointmentId/cancel')
  @UseGuards(CustomerGuard)
  cancelMine(@CurrentCustomer() customer: Customer, @Param('appointmentId') appointmentId: string) {
    const tenant = requireTenant();
    return this.agenda.cancelMine(tenant.id, customer, appointmentId);
  }

  @Get('appointments/:code')
  @Header('Cache-Control', 'no-store')
  byCode(@Param('code') code: string) {
    const tenant = requireTenant();
    return this.agenda.byCode(tenant.id, code);
  }

  @Post('appointments/:code/cancel')
  cancel(@Param('code') code: string) {
    const tenant = requireTenant();
    return this.agenda.cancelByCode(tenant.id, code);
  }
}

function requireTenant() {
  const tenant = currentInstallation();
  if (!tenant) throw new NotFoundException('Tenant não resolvido para esta requisição.');
  return tenant;
}
