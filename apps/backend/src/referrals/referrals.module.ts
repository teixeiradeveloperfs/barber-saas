import { Global, Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module.js';
import { AdminReferralsController, PublicReferralsController } from './referrals.controller.js';
import { ReferralsService } from './referrals.service.js';

@Global()
@Module({
  imports: [AdminModule],
  controllers: [PublicReferralsController, AdminReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
