import { Injectable, Logger } from '@nestjs/common';
import type { AppointmentStatus } from '../generated/prisma/enums.js';

export type AppointmentEvent =
  | { type: 'criado'; installationId: string; appointmentId: string }
  | { type: 'status'; installationId: string; appointmentId: string; status: AppointmentStatus; by: 'cliente' | 'barbearia' };

type Listener = (event: AppointmentEvent) => unknown;

/**
 * Avisa quem quiser saber que uma reserva nasceu ou mudou de status (hoje, o
 * WhatsApp). Roda depois da resposta: falha de quem escuta nunca derruba a
 * reserva.
 */
@Injectable()
export class AppointmentEvents {
  private readonly logger = new Logger(AppointmentEvents.name);
  private readonly listeners: Listener[] = [];

  on(listener: Listener) {
    this.listeners.push(listener);
  }

  emit(event: AppointmentEvent) {
    for (const listener of this.listeners) {
      setImmediate(() => {
        Promise.resolve()
          .then(() => listener(event))
          .catch((error: unknown) => this.logger.warn(`Evento ${event.type} de ${event.appointmentId}: ${error instanceof Error ? error.message : String(error)}`));
      });
    }
  }
}
