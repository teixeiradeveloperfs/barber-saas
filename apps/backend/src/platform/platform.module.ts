import { Global, Module } from '@nestjs/common';
import { LandingController } from './landing.controller.js';
import { LandingService } from './landing.service.js';
import { PlatformService } from './platform.service.js';

@Global()
@Module({
  controllers: [LandingController],
  providers: [PlatformService, LandingService],
  exports: [PlatformService, LandingService],
})
export class PlatformModule {}
