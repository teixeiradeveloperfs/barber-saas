import { Injectable } from '@nestjs/common';
import type { LandingEventKind } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type LandingEventInput = {
  kind: LandingEventKind;
  sessionId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  path?: string;
};

type SourceRow = { source: string; medium: string | null; campaign: string | null; visitas: number; contatos: number; demos: number };
type DayRow = { day: string; visitas: number; contatos: number };

const DAY_MS = 24 * 60 * 60 * 1000;

function clean(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Sem UTM, a origem é o domínio de quem mandou; sem nada, "direto". */
function sourceOf(utmSource: string | null, referrer: string | null) {
  if (utmSource) return utmSource.toLowerCase();
  if (referrer) {
    try {
      return new URL(referrer).hostname.replace(/^www\./, '');
    } catch {
      return referrer.slice(0, 60);
    }
  }
  return 'direto';
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Eventos da landing e o resumo por origem que o painel mostra. */
@Injectable()
export class LandingService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: LandingEventInput) {
    if (input.kind === 'VISITA') {
      const since = new Date(Date.now() - DAY_MS);
      const existing = await this.prisma.landingEvent.findFirst({
        where: { kind: 'VISITA', sessionId: input.sessionId, createdAt: { gte: since } },
        select: { id: true },
      });
      if (existing) return { ok: true as const, repetida: true };
    }
    await this.prisma.landingEvent.create({
      data: {
        kind: input.kind,
        sessionId: input.sessionId,
        utmSource: clean(input.utmSource),
        utmMedium: clean(input.utmMedium),
        utmCampaign: clean(input.utmCampaign),
        utmTerm: clean(input.utmTerm),
        utmContent: clean(input.utmContent),
        referrer: clean(input.referrer),
        path: clean(input.path),
      },
    });
    return { ok: true as const };
  }

  /** Totais, quebra por origem/mídia/campanha e por dia. Agrega em memória: volume de landing, não de app. */
  async stats(days: number) {
    const since = new Date(Date.now() - days * DAY_MS);
    const rows = await this.prisma.landingEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      select: { kind: true, utmSource: true, utmMedium: true, utmCampaign: true, referrer: true, createdAt: true },
    });

    const totals = { visitas: 0, contatos: 0, demos: 0 };
    const sources = new Map<string, SourceRow>();
    const daysMap = new Map<string, DayRow>();
    for (let index = days - 1; index >= 0; index -= 1) {
      const key = dayKey(new Date(Date.now() - index * DAY_MS));
      daysMap.set(key, { day: key, visitas: 0, contatos: 0 });
    }

    for (const row of rows) {
      const bucket = row.kind === 'VISITA' ? 'visitas' : row.kind === 'CONTATO' ? 'contatos' : 'demos';
      totals[bucket] += 1;

      const source = sourceOf(row.utmSource, row.referrer);
      const medium = row.utmMedium?.toLowerCase() ?? null;
      const campaign = row.utmCampaign ?? null;
      const key = `${source}|${medium ?? ''}|${campaign ?? ''}`;
      const entry = sources.get(key) ?? { source, medium, campaign, visitas: 0, contatos: 0, demos: 0 };
      entry[bucket] += 1;
      sources.set(key, entry);

      const day = daysMap.get(dayKey(row.createdAt));
      if (day && bucket !== 'demos') day[bucket] += 1;
    }

    return {
      days,
      since,
      totals,
      bySource: [...sources.values()].sort((a, b) => b.visitas - a.visitas || b.contatos - a.contatos),
      byDay: [...daysMap.values()],
    };
  }
}
