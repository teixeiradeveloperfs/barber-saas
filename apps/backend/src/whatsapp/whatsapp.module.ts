import { Global, Module } from '@nestjs/common';
import { ConfigsService } from '../admin/configs/configs.service.js';
import { NotificationsService } from './notifications.service.js';
import { WahaClient } from './waha.client.js';
import { WhatsappWebhookController } from './whatsapp-webhook.controller.js';
import { WhatsappService } from './whatsapp.service.js';

@Global()
@Module({
  controllers: [WhatsappWebhookController],
  providers: [WahaClient, WhatsappService, NotificationsService, ConfigsService],
  exports: [WhatsappService, NotificationsService],
})
export class WhatsappModule {}
