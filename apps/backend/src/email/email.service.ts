import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type EmailMessage = { to: string; subject: string; html: string; text: string; replyTo?: string };

/**
 * E-mails da plataforma pelo Resend. Com `RESEND_API_KEY` envia de verdade;
 * sem ela, registra no log e guarda o último por destinatário (dev e testes).
 * `EMAIL_FROM` precisa ser de um domínio verificado no Resend.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger('E-mail');
  private readonly apiKey: string;
  private readonly from: string;
  private readonly replyTo: string | undefined;
  private readonly last = new Map<string, EmailMessage & { at: Date }>();

  constructor(env: ConfigService) {
    this.apiKey = (env.get<string>('RESEND_API_KEY') ?? '').trim();
    this.from = env.get<string>('EMAIL_FROM')?.trim() || 'Sua Barbearia <nao-responda@suabarbearia.app>';
    this.replyTo = env.get<string>('EMAIL_REPLY_TO')?.trim() || undefined;
  }

  get provider(): 'resend' | 'console' {
    return this.apiKey ? 'resend' : 'console';
  }

  /** Nunca derruba quem chamou: falha de e-mail vira log. Devolve se foi aceito. */
  async send(message: EmailMessage): Promise<boolean> {
    const to = message.to.trim().toLowerCase();
    if (!this.apiKey) {
      this.last.set(to, { ...message, to, at: new Date() });
      this.logger.log(`[console] para ${to}: ${message.subject}\n${message.text}`);
      return true;
    }
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: this.from, to: [to], subject: message.subject, html: message.html, text: message.text, reply_to: message.replyTo ?? this.replyTo }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        this.logger.warn(`Resend respondeu ${response.status} para ${to}: ${(await response.text()).slice(0, 300)}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.warn(`Resend falhou para ${to}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /** Último e-mail para um endereço quando o provedor é o console (só fora de produção). */
  devLast(to: string) {
    return this.last.get(to.trim().toLowerCase()) ?? null;
  }
}
