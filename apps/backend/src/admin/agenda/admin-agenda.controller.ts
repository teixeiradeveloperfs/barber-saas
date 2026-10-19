import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AgendaService } from '../../agenda/agenda.service.js';
import { isDateString, isTimeString, zonedToUtc } from '../../agenda/time.js';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import type { Actor } from '../auth/admin-auth.service.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentActor, RolesGuard } from '../auth/roles.js';
import { ConfigsService } from '../configs/configs.service.js';
import { AdminInstallationService } from '../installation/admin-installation.service.js';

const date = z.string().refine(isDateString, 'Data no formato AAAA-MM-DD.');
const time = z.string().refine(isTimeString, 'Hora no formato HH:MM.');
const status = z.enum(['MARCADO', 'CONFIRMADO', 'CONCLUIDO', 'FALTOU', 'CANCELADO']);
const phone = z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().regex(/^\d{10,15}$/, 'WhatsApp com DDD, só números.'));

const bookSchema = z.object({
  barberId: z.string().min(1),
  serviceIds: z.array(z.string().min(1)).min(1, 'Escolha pelo menos um serviço.'),
  coveredServiceIds: z.array(z.string()).optional(),
  date,
  time,
  customer: z.object({ name: z.string().trim().min(2, 'Informe o nome do cliente.'), phone }),
  notes: z.string().max(280).optional(),
});
const updateSchema = z.object({ status: status.optional(), notes: z.string().max(280).optional() });
const blockSchema = z.object({
  barberId: z.string().min(1).nullable().optional(),
  date,
  from: time,
  to: time,
  reason: z.string().max(120).optional(),
});
const agendaStateSchema = z.object({ open: z.boolean(), reason: z.string().max(120).optional() });

/**
 * Agenda no painel. Dono e gestor operam tudo; barbeiro vê a própria agenda e
 * marca presença ou falta. Plataforma passa como dono.
 */
@Controller('admin/installation/agenda')
@UseGuards(AdminGuard, RolesGuard)
export class AdminAgendaController {
  constructor(
    private readonly agenda: AgendaService,
    private readonly tenants: AdminInstallationService,
    private readonly configs: ConfigsService,
  ) {}

  /** Config em vigor para nomes de barbeiros e serviços: publicado, senão rascunho. */
  private async config(installationId: string) {
    const state = await this.configs.state(installationId);
    const version = state.published ?? state.draft;
    if (!version) throw new Error('Barbearia sem configuração.');
    return version.config;
  }

  /** Horários livres de um barbeiro num dia, para agendar pelo painel. */
  @Get('slots')
  async slots(@CurrentActor() actor: Actor, @Query('barber') barberId = '', @Query('date') day = '', @Query('duration') duration = '30') {
    const id = await this.tenants.installationId();
    await this.tenants.access(actor, id);
    if (!barberId || !isDateString(day)) throw new BadRequestException('Informe barbeiro e data.');
    const durationMin = Math.max(5, Math.min(480, Number(duration) || 30));
    // Painel pode encaixar agora: sem a folga de 30 min do app.
    return this.agenda.slots(id, await this.config(id), barberId, day, durationMin, new Date(Date.now() - 30 * 60_000));
  }

  @Get('appointments')
  async list(
    @CurrentActor() actor: Actor,
    @Query('from') from = '',
    @Query('to') to = '',
    @Query('barber') barberId?: string,
    @Query('status') statusFilter?: string,
  ) {
    const id = await this.tenants.installationId();
    const access = await this.tenants.access(actor, id);
    const start = isDateString(from) ? zonedToUtc(from, '00:00') : new Date(new Date().setHours(0, 0, 0, 0));
    const end = isDateString(to) ? zonedToUtc(to, '24:00') : new Date(start.getTime() + 24 * 60 * 60_000);
    const parsedStatus = status.safeParse(statusFilter);
    return this.agenda.list(id, { id: actor.id, role: access.role, barberId: access.barberId }, { from: start, to: end, barberId: barberId || undefined, status: parsedStatus.success ? parsedStatus.data : undefined });
  }

  @Post('appointments')
  async book(@CurrentActor() actor: Actor, @Body(new ZodValidationPipe(bookSchema)) body: z.infer<typeof bookSchema>) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.agenda.book(id, await this.config(id), body, 'PAINEL', { skipCutoff: true });
  }

  @Patch('appointments/:appointmentId')
  async update(@CurrentActor() actor: Actor, @Param('appointmentId') appointmentId: string, @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    const id = await this.tenants.installationId();
    const access = await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR', 'BARBEIRO']);
    return this.agenda.updateStatus(id, { id: actor.id, role: access.role, barberId: access.barberId }, appointmentId, body);
  }

  @Get('blocks')
  async blocks(@CurrentActor() actor: Actor, @Query('from') from = '', @Query('to') to = '') {
    const id = await this.tenants.installationId();
    await this.tenants.access(actor, id);
    const start = isDateString(from) ? zonedToUtc(from, '00:00') : new Date(new Date().setHours(0, 0, 0, 0));
    const end = isDateString(to) ? zonedToUtc(to, '24:00') : new Date(start.getTime() + 7 * 24 * 60 * 60_000);
    return this.agenda.listBlocks(id, start, end);
  }

  @Post('blocks')
  async addBlock(@CurrentActor() actor: Actor, @Body(new ZodValidationPipe(blockSchema)) body: z.infer<typeof blockSchema>) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.agenda.addBlock(id, await this.config(id), actor.id, {
      barberId: body.barberId ?? null,
      startsAt: zonedToUtc(body.date, body.from),
      endsAt: zonedToUtc(body.date, body.to),
      reason: body.reason,
    });
  }

  @Delete('blocks/:blockId')
  async removeBlock(@CurrentActor() actor: Actor, @Param('blockId') blockId: string) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.agenda.removeBlock(id, blockId);
  }

  @Get('barbers')
  async barbers(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.access(actor, id);
    return this.agenda.barbers(id, await this.config(id));
  }

  @Put('barbers/:barberId')
  async setBarberAgenda(@CurrentActor() actor: Actor, @Param('barberId') barberId: string, @Body(new ZodValidationPipe(agendaStateSchema)) body: z.infer<typeof agendaStateSchema>) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.agenda.setBarberAgenda(id, await this.config(id), barberId, body);
  }
}
