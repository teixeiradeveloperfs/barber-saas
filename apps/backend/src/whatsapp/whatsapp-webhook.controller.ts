import { Body, Controller, Headers, HttpCode, Logger, Post, UnauthorizedException } from '@nestjs/common';
import { NotificationsService, type WahaWebhook } from './notifications.service.js';
import { WhatsappService } from './whatsapp.service.js';

/**
 * Eventos do WAHA (estado da sessão e mensagens recebidas). Fora de `/public`
 * para o hook de barbearia não rodar; autenticado pelo cabeçalho que a própria
 * sessão manda (`x-webhook-token`).
 */
@Controller('platform/whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger('WhatsApp webhook');

  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly notifications: NotificationsService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  receive(@Headers('x-webhook-token') token: string | undefined, @Body() body: WahaWebhook) {
    if (!this.whatsapp.checkWebhookToken(token)) throw new UnauthorizedException();
    // Responde na hora; o WAHA não precisa esperar o envio da resposta.
    void this.notifications.handleWebhook(body ?? {}).catch((error: unknown) => this.logger.warn(error instanceof Error ? error.message : String(error)));
    return { ok: true };
  }
}
