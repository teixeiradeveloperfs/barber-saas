import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { TeamService } from '../../team/team.service.js';
import type { Actor } from '../auth/admin-auth.service.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentActor, RolesGuard } from '../auth/roles.js';
import { AdminInstallationService } from '../installation/admin-installation.service.js';

const barberSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use letras minúsculas, números e hifens.').min(2).max(40).optional(),
  name: z.string().trim().min(2, 'Informe o nome.'),
  tier: z.enum(['Pro', 'Novo']).nullable().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().min(0).optional(),
  specialties: z.array(z.string().trim().min(1)).max(12).optional(),
  nextAvailable: z.object({ label: z.string().trim().min(1), today: z.boolean() }).optional(),
  image: z.string().optional(),
  active: z.boolean().optional(),
});
const updateSchema = barberSchema.partial().omit({ slug: true });
const orderSchema = z.object({ order: z.array(z.string()).min(1) });

/** Equipe como operação: dono e gestor cadastram, editam, ordenam e afastam. Mudanças vão para o app na hora. */
@Controller('admin/installation/team')
@UseGuards(AdminGuard, RolesGuard)
export class AdminTeamController {
  constructor(
    private readonly team: TeamService,
    private readonly tenants: AdminInstallationService,
  ) {}

  @Get()
  async list(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.access(actor, id);
    return this.team.list(id);
  }

  @Post()
  async create(@CurrentActor() actor: Actor, @Body(new ZodValidationPipe(barberSchema)) body: z.infer<typeof barberSchema>) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.team.create(id, body);
  }

  @Patch(':slug')
  async update(@CurrentActor() actor: Actor, @Param('slug') slug: string, @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.team.update(id, slug, body);
  }

  @Delete(':slug')
  async remove(@CurrentActor() actor: Actor, @Param('slug') slug: string) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.team.remove(id, slug);
  }

  @Put('order')
  async reorder(@CurrentActor() actor: Actor, @Body(new ZodValidationPipe(orderSchema)) body: z.infer<typeof orderSchema>) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.team.reorder(id, body.order);
  }
}
