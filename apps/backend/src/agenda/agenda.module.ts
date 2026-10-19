import { Global, Module } from '@nestjs/common';
import { AgendaService } from './agenda.service.js';
import { AppointmentEvents } from './appointment-events.js';

@Global()
@Module({
  providers: [AgendaService, AppointmentEvents],
  exports: [AgendaService, AppointmentEvents],
})
export class AgendaModule {}
