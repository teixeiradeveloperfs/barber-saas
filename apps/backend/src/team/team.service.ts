import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Barber as ConfigBarber, AppConfig } from '@barber/tenant-config';
import { PrismaService } from '../prisma/prisma.service.js';

export type BarberInput = {
  slug?: string;
  name: string;
  tier?: 'Pro' | 'Novo' | null;
  rating?: number;
  reviews?: number;
  specialties?: string[];
  nextAvailable?: { label: string; today: boolean };
  image?: string;
  active?: boolean;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * Equipe em tabela própria. Barbearias antigas tinham a equipe dentro do
 * config publicado: na primeira leitura ela é importada para cá e o JSON
 * deixa de ser fonte.
 */
@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lista completa (ativos e afastados), em ordem. Importa do config na primeira vez. */
  async list(installationId: string) {
    await this.ensureImported(installationId);
    const rows = await this.prisma.barber.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    return rows.map(shape);
  }

  /** Equipe ativa no formato que o app espera em `config.barbers`. */
  async asConfigBarbers(installationId: string): Promise<ConfigBarber[]> {
    const all = await this.list(installationId);
    return all
      .filter((barber) => barber.active)
      .map((barber) => ({
        id: barber.slug,
        name: barber.name,
        tier: barber.tier,
        rating: barber.rating,
        reviews: barber.reviews,
        specialties: barber.specialties,
        nextAvailable: barber.nextAvailable,
        image: barber.image,
      }));
  }

  /** Devolve o config com `barbers` vindo da tabela. */
  async inject(installationId: string, config: AppConfig): Promise<AppConfig> {
    return { ...config, barbers: await this.asConfigBarbers(installationId) };
  }

  async create(installationId: string, input: BarberInput) {
    await this.ensureImported(installationId);
    const name = input.name.trim();
    const slug = (input.slug?.trim() || slugify(name) || 'barbeiro').toLowerCase();
    if (!SLUG.test(slug) || slug.length < 2) throw new ConflictException('Identificador inválido: use letras minúsculas, números e hifens.');
    const taken = await this.prisma.barber.findUnique({ where: { slug } });
    if (taken) throw new ConflictException(`Já existe um barbeiro com o identificador "${slug}".`);
    const last = await this.prisma.barber.aggregate({ _max: { position: true } });
    const row = await this.prisma.barber.create({
      data: {
        slug,
        name,
        tier: input.tier ?? null,
        rating: input.rating ?? 5,
        reviews: input.reviews ?? 0,
        specialties: input.specialties ?? [],
        nextAvailableLabel: input.nextAvailable?.label ?? 'Hoje',
        nextAvailableToday: input.nextAvailable?.today ?? true,
        image: input.image ?? '',
        active: input.active ?? true,
        position: (last._max.position ?? -1) + 1,
      },
    });
    return shape(row);
  }

  async update(installationId: string, slug: string, input: Partial<BarberInput>) {
    const row = await this.find(installationId, slug);
    const updated = await this.prisma.barber.update({
      where: { id: row.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.tier !== undefined ? { tier: input.tier } : {}),
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.reviews !== undefined ? { reviews: input.reviews } : {}),
        ...(input.specialties !== undefined ? { specialties: input.specialties } : {}),
        ...(input.nextAvailable !== undefined ? { nextAvailableLabel: input.nextAvailable.label, nextAvailableToday: input.nextAvailable.today } : {}),
        ...(input.image !== undefined ? { image: input.image } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    return shape(updated);
  }

  /** Remove de vez. Com atendimentos ou acesso vinculado, prefira afastar (`active: false`). */
  async remove(installationId: string, slug: string) {
    const row = await this.find(installationId, slug);
    const [appointments, members] = await Promise.all([
      this.prisma.appointment.count({ where: { barberId: slug } }),
      this.prisma.adminUser.count({ where: { memberBarberId: slug, status: 'ATIVO' } }),
    ]);
    if (members > 0) throw new ConflictException('Essa pessoa tem acesso ao painel. Remova o acesso antes, ou afaste o barbeiro em vez de remover.');
    if (appointments > 0) throw new ConflictException('Esse barbeiro tem atendimentos registrados. Afaste em vez de remover, para manter o histórico.');
    await this.prisma.barber.delete({ where: { id: row.id } });
    return { ok: true as const };
  }

  /** Nova ordem de exibição no app: lista de identificadores. */
  async reorder(installationId: string, slugs: string[]) {
    const rows = await this.list(installationId);
    const known = new Set(rows.map((barber) => barber.slug));
    const ordered = slugs.filter((slug) => known.has(slug));
    const rest = rows.map((barber) => barber.slug).filter((slug) => !ordered.includes(slug));
    const finalOrder = [...ordered, ...rest];
    await this.prisma.$transaction(
      finalOrder.map((slug, position) => this.prisma.barber.update({ where: { slug }, data: { position } })),
    );
    return this.list(installationId);
  }

  private async find(installationId: string, slug: string) {
    await this.ensureImported(installationId);
    const row = await this.prisma.barber.findUnique({ where: { slug } });
    if (!row) throw new NotFoundException('Barbeiro não encontrado.');
    return row;
  }

  /** Migração preguiçosa: sem linhas, copia `barbers` do config publicado (ou rascunho). */
  private async ensureImported(installationId: string) {
    const count = await this.prisma.barber.count();
    if (count > 0) return;
    const version = await this.prisma.appConfig.findFirst({
      where: {},
      orderBy: [{ published: 'desc' }, { version: 'desc' }],
    });
    const barbers = ((version?.config as { barbers?: ConfigBarber[] } | null)?.barbers ?? []).filter((barber) => barber && typeof barber.id === 'string');
    if (barbers.length === 0) return;
    await this.prisma.barber.createMany({
      data: barbers.map((barber, position) => ({
        slug: barber.id,
        name: barber.name,
        tier: barber.tier ?? null,
        rating: barber.rating,
        reviews: barber.reviews,
        specialties: barber.specialties,
        nextAvailableLabel: barber.nextAvailable.label,
        nextAvailableToday: barber.nextAvailable.today,
        image: barber.image,
        position,
      })),
      skipDuplicates: true,
    });
  }
}

function shape(row: {
  slug: string;
  name: string;
  tier: string | null;
  rating: { toString(): string };
  reviews: number;
  specialties: string[];
  nextAvailableLabel: string;
  nextAvailableToday: boolean;
  image: string;
  active: boolean;
  position: number;
  createdAt: Date;
}) {
  return {
    slug: row.slug,
    name: row.name,
    tier: (row.tier === 'Pro' || row.tier === 'Novo' ? row.tier : null) as 'Pro' | 'Novo' | null,
    rating: Number(row.rating.toString()),
    reviews: row.reviews,
    specialties: row.specialties,
    nextAvailable: { label: row.nextAvailableLabel, today: row.nextAvailableToday },
    image: row.image,
    active: row.active,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
  };
}
