import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AdminModule } from './admin/admin.module.js';
import { AgendaModule } from './agenda/agenda.module.js';
import { TeamModule } from './team/team.module.js';
import { MediaModule } from './media/media.module.js';
import { MessagingModule } from './messaging/messaging.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { PlatformModule } from './platform/platform.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PublicModule } from './public/public.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { WhatsappModule } from './whatsapp/whatsapp.module.js';
import { EmailModule } from './email/email.module.js';
import { ReferralsModule } from './referrals/referrals.module.js';

const nodeEnv = process.env.NODE_ENV ?? 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Primeiro arquivo encontrado vence; .env serve de fallback local.
      envFilePath: [`.env.${nodeEnv}`, '.env'],
    }),
    PrismaModule,
    EmailModule,
    ReferralsModule,
    PlatformModule,
    AgendaModule,
    TeamModule,
    MediaModule,
    MessagingModule,
    CustomersModule,
    TenantsModule,
    WhatsappModule,
    PublicModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
