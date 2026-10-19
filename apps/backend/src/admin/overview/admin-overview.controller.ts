import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import type { Actor } from '../auth/admin-auth.service.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentActor, RolesGuard } from '../auth/roles.js';
import { AdminInstallationService } from '../installation/admin-installation.service.js';
import { OverviewService } from './overview.service.js';

/** Início da barbearia. Dono e gestor; barbeiro cai na própria agenda. */
@Controller('admin/installation/overview')
@UseGuards(AdminGuard, RolesGuard)
export class AdminOverviewController {
  constructor(
    private readonly overview: OverviewService,
    private readonly tenants: AdminInstallationService,
  ) {}

  @Get()
  async get(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.overview.forTenant(id);
  }
}
