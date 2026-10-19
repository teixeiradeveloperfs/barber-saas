import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module.js';
import { AppIconService } from './app-icon.service.js';
import { PublicAgendaController } from './public-agenda.controller.js';
import { PublicController } from './public.controller.js';

@Module({
  imports: [TenantsModule],
  controllers: [PublicController, PublicAgendaController],
  providers: [AppIconService],
})
export class PublicModule {}
