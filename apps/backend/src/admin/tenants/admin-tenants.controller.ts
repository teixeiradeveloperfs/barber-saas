import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import type { Actor } from '../auth/admin-auth.service.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentActor, RolesGuard } from '../auth/roles.js';
import { ConfigsService } from '../configs/configs.service.js';
import { PreviewService } from '../preview/preview.service.js';
import { AdminInstallationService } from '../installation/admin-installation.service.js';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(['ATIVO', 'SUSPENSO', 'ENCERRADO']).optional(),
});
const memberUpdateSchema = z.object({
  role: z.enum(['DONO', 'GESTOR', 'BARBEIRO']),
  barberId: z.string().min(1).nullable().optional(),
});
const memberSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  name: z.string().min(2).optional(),
  role: z.enum(['DONO', 'GESTOR', 'BARBEIRO']).optional(),
  barberId: z.string().min(1).nullable().optional(),
});

@Controller('admin/installation')
@UseGuards(AdminGuard, RolesGuard)
export class AdminTenantsController {
  constructor(
    private readonly tenants: AdminInstallationService,
    private readonly configs: ConfigsService,
    private readonly preview: PreviewService,
  ) {}

  @Get()
  async get(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    return this.tenants.get(actor, id);
  }

  @Patch()
  async update(@CurrentActor() actor: Actor, @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    const id = await this.tenants.installationId();
    return this.tenants.update(actor, id, body);
  }

  /* ---------- donos ---------- */

  @Get('members')
  async listMembers(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    return this.tenants.listMembers(actor, id);
  }

  @Post('members')
  async addMember(@CurrentActor() actor: Actor, @Body(new ZodValidationPipe(memberSchema)) body: z.infer<typeof memberSchema>) {
    const id = await this.tenants.installationId();
    return this.tenants.addMember(actor, id, body);
  }

  @Patch('members/:userId')
  async updateMember(@CurrentActor() actor: Actor, @Param('userId') userId: string, @Body(new ZodValidationPipe(memberUpdateSchema)) body: z.infer<typeof memberUpdateSchema>) {
    const id = await this.tenants.installationId();
    return this.tenants.updateMember(actor, id, userId, body);
  }

  @Post('members/:userId/reset-password')
  async resetMemberPassword(@CurrentActor() actor: Actor, @Param('userId') userId: string) {
    const id = await this.tenants.installationId();
    return this.tenants.resetMemberPassword(actor, id, userId);
  }

  @Delete('members/:userId')
  async removeMember(@CurrentActor() actor: Actor, @Param('userId') userId: string) {
    const id = await this.tenants.installationId();
    return this.tenants.removeMember(actor, id, userId);
  }

  /* ---------- config ---------- */

  @Get('config')
  async config(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.configs.state(id);
  }

  @Put('config/draft')
  async saveDraft(@CurrentActor() actor: Actor, @Body() body: unknown) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    const tenant = await this.tenants.get(actor, id);
    return this.configs.saveDraft(id, tenant.slug, body);
  }

  @Post('config/publish')
  async publish(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.configs.publish(id);
  }

  @Delete('config/draft')
  async discard(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.configs.discardDraft(id);
  }

  @Post('preview-token')
  async previewToken(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    const tenant = await this.tenants.get(actor, id);
    return { token: await this.preview.issue(tenant.slug), slug: tenant.slug, expiresInSeconds: 2 * 60 * 60 };
  }

}
