import { Injectable, NotFoundException } from '@nestjs/common';
import { parseAppConfig } from '@barber/tenant-config';
import { PrismaService } from '../prisma/prisma.service.js';
import { TeamService } from '../team/team.service.js';
import type { ResolvedInstallation } from './tenant-context.js';
import { SINGLE_TENANT_SLUG } from './single-tenant.js';

@Injectable()
export class InstallationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly team: TeamService,
  ) {}

  /** Every frontend belongs to this one installation. */
  async isKnownHost(_hostname: string) {
    return true;
  }

  /** Devolve a configuração publicada da instalação única. */
  async resolve(
    _hostname: string,
    _slugOverride?: string | null,
    options: { draft?: boolean } = {},
  ): Promise<ResolvedInstallation> {
    // Preview do admin: a versão mais nova, publicada ou não. O host nunca seleciona dados.
    const tenant = await this.prisma.installation.findFirst({ where: { slug: SINGLE_TENANT_SLUG, status: 'ATIVO' } });
    if (!tenant) throw new NotFoundException(`A barbearia única (${SINGLE_TENANT_SLUG}) não foi encontrada.`);
    const version = await this.prisma.appConfig.findFirst({ where: options.draft ? {} : { published: true }, orderBy: { version: 'desc' } });
    if (!version) {
      throw new NotFoundException(`A barbearia ${tenant.name} ainda não publicou o app.`);
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      hostname: 'localhost',
      // Equipe vem da tabela, não do JSON: cadastro pelo painel vale na hora, sem publicar.
      config: await this.team.inject(tenant.id, parseAppConfig(version.config)),
      draft: !version.published,
    };
  }
}
