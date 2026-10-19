import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type WahaStatus = 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'PASSKEY_REQUIRED' | 'PASSKEY_CONFIRMATION_REQUIRED' | 'WORKING' | 'FAILED';

export type WahaSession = {
  name: string;
  status: WahaStatus;
  me: { id: string; pushName?: string } | null;
};

export class WahaError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Cliente HTTP do WAHA (WhatsApp HTTP API, motor GOWS/whatsmeow), que roda
 * como serviço à parte. Cada barbearia é uma sessão. Sem `WAHA_URL`, o
 * WhatsApp fica desligado na plataforma.
 */
@Injectable()
export class WahaClient {
  private readonly logger = new Logger('WAHA');
  readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(env: ConfigService) {
    this.baseUrl = (env.get<string>('WAHA_URL') ?? '').trim().replace(/\/$/, '');
    this.apiKey = (env.get<string>('WAHA_API_KEY') ?? '').trim();
  }

  get enabled() {
    return Boolean(this.baseUrl);
  }

  private async call<T>(method: string, path: string, body?: unknown, accept = 'application/json'): Promise<T> {
    if (!this.enabled) throw new ServiceUnavailableException('WhatsApp não está disponível nesta plataforma.');
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { accept, 'x-api-key': this.apiKey, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      this.logger.warn(`${method} ${path}: ${error instanceof Error ? error.message : String(error)}`);
      throw new WahaError(503, 'O serviço de WhatsApp não respondeu. Tente de novo em instantes.');
    }
    const text = await response.text();
    if (!response.ok) {
      let message = text.slice(0, 300);
      try {
        const parsed = JSON.parse(text) as { message?: unknown; error?: unknown };
        message = String(parsed.message ?? parsed.error ?? message);
      } catch {
        /* texto puro */
      }
      throw new WahaError(response.status, message || `WAHA respondeu ${response.status}`);
    }
    return (text ? JSON.parse(text) : null) as T;
  }

  async session(name: string): Promise<WahaSession | null> {
    try {
      return await this.call<WahaSession>('GET', `/api/sessions/${encodeURIComponent(name)}`);
    } catch (error) {
      if (error instanceof WahaError && error.status === 404) return null;
      throw error;
    }
  }

  createSession(name: string, config: { webhookUrl: string; webhookToken: string; metadata: Record<string, string> }) {
    return this.call<WahaSession>('POST', '/api/sessions', {
      name,
      start: true,
      config: {
        metadata: config.metadata,
        client: { deviceName: 'BarberOS', browserName: 'Chrome' },
        ignore: { status: true, groups: true, channels: true, broadcast: true },
        webhooks: [
          {
            url: config.webhookUrl,
            events: ['session.status', 'message'],
            retries: { policy: 'exponential', delaySeconds: 2, attempts: 6 },
            customHeaders: [{ name: 'x-webhook-token', value: config.webhookToken }],
          },
        ],
      },
    });
  }

  updateSession(name: string, config: { webhookUrl: string; webhookToken: string; metadata: Record<string, string> }) {
    return this.call<WahaSession>('PUT', `/api/sessions/${encodeURIComponent(name)}`, {
      config: {
        metadata: config.metadata,
        client: { deviceName: 'BarberOS', browserName: 'Chrome' },
        ignore: { status: true, groups: true, channels: true, broadcast: true },
        webhooks: [
          {
            url: config.webhookUrl,
            events: ['session.status', 'message'],
            retries: { policy: 'exponential', delaySeconds: 2, attempts: 6 },
            customHeaders: [{ name: 'x-webhook-token', value: config.webhookToken }],
          },
        ],
      },
    });
  }

  start(name: string) {
    return this.call<WahaSession>('POST', `/api/sessions/${encodeURIComponent(name)}/start`);
  }

  stop(name: string) {
    return this.call<WahaSession>('POST', `/api/sessions/${encodeURIComponent(name)}/stop`);
  }

  logout(name: string) {
    return this.call<WahaSession>('POST', `/api/sessions/${encodeURIComponent(name)}/logout`, {});
  }

  /** QR atual em PNG (base64). */
  qr(name: string) {
    return this.call<{ mimetype: string; data: string }>('GET', `/api/${encodeURIComponent(name)}/auth/qr?format=image`);
  }

  /** Código de 8 caracteres para digitar no celular em vez de ler o QR. */
  requestCode(name: string, phone: string) {
    return this.call<{ code: string }>('POST', `/api/${encodeURIComponent(name)}/auth/request-code`, { phoneNumber: phone });
  }

  /** chatId oficial do número (resolve o nono dígito e o @lid). Nulo se não tem WhatsApp. */
  async chatIdFor(session: string, phone: string): Promise<string | null> {
    const result = await this.call<{ numberExists: boolean; chatId?: string }>(
      'GET',
      `/api/contacts/check-exists?session=${encodeURIComponent(session)}&phone=${encodeURIComponent(phone)}`,
    );
    return result.numberExists && result.chatId ? result.chatId : null;
  }

  /** Telefone (@c.us) de um contato que chegou como @lid. */
  async phoneForLid(session: string, lid: string): Promise<string | null> {
    try {
      const result = await this.call<{ pn?: string | null }>('GET', `/api/${encodeURIComponent(session)}/lids/${encodeURIComponent(lid)}`);
      return result.pn ?? null;
    } catch {
      return null;
    }
  }

  sendText(session: string, chatId: string, text: string) {
    return this.call<{ id?: string }>('POST', '/api/sendText', { session, chatId, text, linkPreview: false });
  }

  async sendSeen(session: string, chatId: string) {
    await this.call('POST', '/api/sendSeen', { session, chatId }).catch(() => undefined);
  }

  async typing(session: string, chatId: string, on: boolean) {
    await this.call('POST', on ? '/api/startTyping' : '/api/stopTyping', { session, chatId }).catch(() => undefined);
  }
}
