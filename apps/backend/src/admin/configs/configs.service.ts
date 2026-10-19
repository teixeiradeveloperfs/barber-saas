import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { appConfigSchema, type AppConfig } from '@barber/tenant-config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TeamService } from '../../team/team.service.js';

/**
 * Versões do config: a maior versão publicada é o que o app mostra; a maior
 * versão não publicada acima dela é o rascunho em edição.
 */
@Injectable()
export class ConfigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly team: TeamService,
  ) {}

  async state(installationId: string) {
    const rows = await this.prisma.appConfig.findMany({
      where: {},
      orderBy: { version: 'desc' },
      take: 10,
    });
    const published = rows.find((row) => row.published) ?? null;
    const draft = rows.find((row) => !row.published && (!published || row.version > published.version)) ?? null;
    const barbers = await this.team.asConfigBarbers(installationId);
    // Passa pelo schema para campos novos (ex.: `referral`) chegarem com o padrão em configs antigos.
    const withTeam = (config: unknown): AppConfig => {
      const parsed = appConfigSchema.safeParse({ ...(config as object), barbers });
      return parsed.success ? parsed.data : { ...(config as AppConfig), barbers };
    };
    return {
      published: published ? { version: published.version, config: withTeam(published.config), at: published.createdAt } : null,
      draft: draft ? { version: draft.version, config: withTeam(draft.config), at: draft.createdAt } : null,
    };
  }

  /** Valida e grava o rascunho. Reaproveita a versão do rascunho atual. */
  async saveDraft(installationId: string, installationSlug: string, input: unknown) {
    const parsed = appConfigSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Config inválido.',
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      });
    }
    // O id do config é o slug do tenant, sempre. A equipe não mora mais no JSON (tabela `barbers`).
    const config = { ...parsed.data, id: installationSlug, barbers: [] } satisfies AppConfig;

    const { draft, published } = await this.state(installationId);
    if (draft) {
      const row = await this.prisma.appConfig.update({
        where: { version: draft.version },
        data: { config },
      });
      return { version: row.version, config: await this.team.inject(installationId, config), at: row.createdAt };
    }
    const version = (published?.version ?? 0) + 1;
    const row = await this.prisma.appConfig.create({
      data: { version, published: false, config },
    });
    return { version: row.version, config: await this.team.inject(installationId, config), at: row.createdAt };
  }

  /** Publica o rascunho: ele vira o config do app e o anterior sai do ar. */
  async publish(installationId: string) {
    const { draft } = await this.state(installationId);
    if (!draft) throw new NotFoundException('Não há rascunho para publicar.');
    await this.prisma.$transaction([
      this.prisma.appConfig.updateMany({ where: { published: true }, data: { published: false } }),
      this.prisma.appConfig.update({
        where: { version: draft.version },
        data: { published: true },
      }),
    ]);
    return this.state(installationId);
  }

  /** Descarta o rascunho e volta a editar a partir do publicado. */
  async discardDraft(installationId: string) {
    const { draft } = await this.state(installationId);
    if (draft) {
      await this.prisma.appConfig.delete({ where: { version: draft.version } });
    }
    return this.state(installationId);
  }
}
