import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { LandingService } from './landing.service.js';
import { PlatformService } from './platform.service.js';

const text = (max: number) => z.string().trim().max(max).optional();
const eventSchema = z.object({
  kind: z.enum(['VISITA', 'CONTATO', 'DEMO']),
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, 'Sessão inválida.'),
  utmSource: text(120),
  utmMedium: text(120),
  utmCampaign: text(160),
  utmTerm: text(160),
  utmContent: text(160),
  referrer: text(300),
  path: text(200),
});

/**
 * Rotas públicas do site da plataforma. Fora de `/public` de propósito: o
 * hook de tenant não roda aqui, porque a landing não pertence a barbearia.
 */
@Controller('platform')
export class LandingController {
  constructor(
    private readonly platform: PlatformService,
    private readonly events: LandingService,
  ) {}

  @Get('landing')
  @Header('Cache-Control', 'public, max-age=60')
  landing() {
    return this.platform.landing();
  }

  /** Visita, clique no WhatsApp ou no app modelo, com UTM e referrer. Sem login. */
  @Post('landing/events')
  record(@Body(new ZodValidationPipe(eventSchema)) body: z.infer<typeof eventSchema>) {
    return this.events.record(body);
  }
}
