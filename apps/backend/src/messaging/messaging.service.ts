import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type Channel = 'SMS' | 'WHATSAPP';

/**
 * Envio de mensagens curtas por SMS ou WhatsApp. Com credenciais da Twilio no
 * ambiente usa a API dela; sem credenciais, registra no log (dev) e guarda a
 * última mensagem por telefone para testes.
 */
@Injectable()
export class MessagingService {
  private readonly log = new Logger('Mensagens');
  private readonly lastByPhone = new Map<string, { channel: Channel; text: string; at: Date }>();

  constructor(private readonly env: ConfigService) {}

  get provider(): 'twilio' | 'console' {
    return this.env.get<string>('TWILIO_ACCOUNT_SID')?.trim() && this.env.get<string>('TWILIO_AUTH_TOKEN')?.trim() ? 'twilio' : 'console';
  }

  async send(channel: Channel, phone: string, text: string) {
    if (this.provider === 'twilio') return this.sendTwilio(channel, phone, text);
    this.lastByPhone.set(phone, { channel, text, at: new Date() });
    this.log.log(`[${channel}] para +${phone}: ${text}`);
    return { provider: 'console' as const };
  }

  /** Última mensagem enviada a um telefone quando o provedor é o console (só fora de produção). */
  devLast(phone: string) {
    return this.lastByPhone.get(phone) ?? null;
  }

  private async sendTwilio(channel: Channel, phone: string, text: string) {
    const sid = this.env.getOrThrow<string>('TWILIO_ACCOUNT_SID');
    const token = this.env.getOrThrow<string>('TWILIO_AUTH_TOKEN');
    const from = channel === 'WHATSAPP' ? this.env.get<string>('TWILIO_WHATSAPP_FROM') : this.env.get<string>('TWILIO_SMS_FROM');
    if (!from) throw new ServiceUnavailableException(channel === 'WHATSAPP' ? 'WhatsApp não configurado nesta plataforma.' : 'SMS não configurado nesta plataforma.');
    const to = channel === 'WHATSAPP' ? `whatsapp:+${phone}` : `+${phone}`;
    const sender = channel === 'WHATSAPP' && !from.startsWith('whatsapp:') ? `whatsapp:${from}` : from;
    const body = new URLSearchParams({ To: to, From: sender, Body: text });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.log.error(`Twilio ${response.status}: ${detail.slice(0, 300)}`);
      throw new ServiceUnavailableException('Não conseguimos enviar o código agora. Tente de novo em instantes.');
    }
    return { provider: 'twilio' as const };
  }
}
