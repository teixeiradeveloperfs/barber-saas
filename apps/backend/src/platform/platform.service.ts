import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

const SINGLETON_ID = 'platform';

/** Campos do site da plataforma (landing). Vazio ou nulo limpa. */
export type LandingInput = {
  whatsapp?: string | null;
  demoUrl?: string | null;
  metaPixelId?: string | null;
  googleTagId?: string | null;
  googleAdsConversion?: string | null;
};

type LandingRow = {
  landingWhatsapp: string | null;
  landingDemoUrl: string | null;
  metaPixelId: string | null;
  googleTagId: string | null;
  googleAdsConversion: string | null;
};

function landingView(row: LandingRow) {
  return {
    whatsapp: row.landingWhatsapp,
    demoUrl: row.landingDemoUrl,
    metaPixelId: row.metaPixelId,
    googleTagId: row.googleTagId,
    googleAdsConversion: row.googleAdsConversion,
  };
}

function clean(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Ajustes globais da plataforma (linha única em `platform_settings`). */
@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: ConfigService,
  ) {}

  get platformDomain() {
    return this.env.get<string>('PLATFORM_DOMAIN', 'localhost').toLowerCase();
  }

  get fallbackHost() {
    return this.env.get<string>('PLATFORM_FALLBACK_HOST', '').toLowerCase();
  }

  /** Hosts que pertencem à plataforma e caem na barbearia padrão. */
  isPlatformHost(host: string) {
    return host === this.platformDomain || host === `www.${this.platformDomain}` || (this.fallbackHost !== '' && host === this.fallbackHost);
  }

  async get() {
    const row = await this.prisma.platformSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID },
      update: {},
    });
    return {
      platformDomain: this.platformDomain,
      fallbackHost: this.fallbackHost || null,
      landing: landingView(row),
      updatedAt: row.updatedAt,
    };
  }

  /** O que a landing lê sem login: contato, link do app modelo, IDs de tracking e o plano. */
  async landing() {
    const row = await this.prisma.platformSettings.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID }, update: {} });
    return { ...landingView(row), plan: null, checkout: false };
  }

  async updateLanding(input: LandingInput) {
    const data = {
      ...(input.whatsapp !== undefined && { landingWhatsapp: clean(input.whatsapp)?.replace(/\D/g, '') ?? null }),
      ...(input.demoUrl !== undefined && { landingDemoUrl: clean(input.demoUrl) }),
      ...(input.metaPixelId !== undefined && { metaPixelId: clean(input.metaPixelId) }),
      ...(input.googleTagId !== undefined && { googleTagId: clean(input.googleTagId)?.toUpperCase() ?? null }),
      ...(input.googleAdsConversion !== undefined && { googleAdsConversion: clean(input.googleAdsConversion) }),
    };
    await this.prisma.platformSettings.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, ...data }, update: data });
    return this.get();
  }

}
