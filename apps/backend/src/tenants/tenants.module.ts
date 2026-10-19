import { Module } from '@nestjs/common';
import { InstallationService } from './tenants.service.js';

@Module({
  providers: [InstallationService],
  exports: [InstallationService],
})
export class TenantsModule {}
