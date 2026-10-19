import { Controller, Get, Header, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../admin/auth/admin.guard.js';
import type { Actor } from '../admin/auth/admin-auth.service.js';
import { CurrentActor, RolesGuard } from '../admin/auth/roles.js';
import { AdminInstallationService } from '../admin/installation/admin-installation.service.js';
import { CurrentCustomer, CustomerGuard } from '../customers/customer.guard.js';
import type { Customer } from '../generated/prisma/client.js';
import { currentInstallation } from '../tenants/tenant-context.js';
import { ReferralsService } from './referrals.service.js';

function requireTenant() {
  const tenant = currentInstallation();
  if (!tenant) throw new NotFoundException('Tenant não resolvido para esta requisição.');
  return tenant;
}

/** Indicação no app do cliente. */
@Controller('public/referrals')
export class PublicReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  /** Prévia do link: quem indicou e o que o amigo ganha (tela de cadastro). */
  @Get('code/:code')
  @Header('Cache-Control', 'no-store')
  preview(@Param('code') code: string) {
    const tenant = requireTenant();
    return this.referrals.preview(tenant.id, tenant.config, code);
  }

  /** "Indique e ganhe": código, amigos e recompensas disponíveis. */
  @Get('me')
  @UseGuards(CustomerGuard)
  @Header('Cache-Control', 'no-store')
  me(@CurrentCustomer() customer: Customer) {
    const tenant = requireTenant();
    return this.referrals.me(tenant.id, tenant.config, customer);
  }
}

/** Indicações no painel da barbearia (dono e gestor). */
@Controller('admin/installation/referrals')
@UseGuards(AdminGuard, RolesGuard)
export class AdminReferralsController {
  constructor(
    private readonly referrals: ReferralsService,
    private readonly tenants: AdminInstallationService,
  ) {}

  @Get()
  async summary(@CurrentActor() actor: Actor) {
    const id = await this.tenants.installationId();
    await this.tenants.assertRole(actor, id, ['DONO', 'GESTOR']);
    return this.referrals.summary(id);
  }
}
