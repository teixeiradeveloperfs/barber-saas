import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthController } from './auth/admin-auth.controller.js';
import { AdminAuthService } from './auth/admin-auth.service.js';
import { AdminAgendaController } from './agenda/admin-agenda.controller.js';
import { AdminTeamController } from './team/admin-team.controller.js';
import { AdminMediaController } from './media/admin-media.controller.js';
import { AdminOverviewController } from './overview/admin-overview.controller.js';
import { OverviewService } from './overview/overview.service.js';
import { AdminGuard } from './auth/admin.guard.js';
import { RolesGuard } from './auth/roles.js';
import { ConfigsService } from './configs/configs.service.js';
import { PreviewService } from './preview/preview.service.js';
import { AdminTenantsController } from './tenants/admin-tenants.controller.js';
import { AdminInstallationService } from './installation/admin-installation.service.js';
import { AdminWhatsappController } from './whatsapp/admin-whatsapp.controller.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (env: ConfigService) => ({
        secret: env.getOrThrow<string>('ADMIN_JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AdminAuthController, AdminTenantsController, AdminAgendaController, AdminTeamController, AdminMediaController, AdminOverviewController, AdminWhatsappController],
  providers: [OverviewService, AdminAuthService, AdminGuard, RolesGuard, AdminInstallationService, ConfigsService, PreviewService],
  exports: [PreviewService, AdminInstallationService, AdminAuthService],
})
export class AdminModule {}
