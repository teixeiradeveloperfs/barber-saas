import { Global, Module } from '@nestjs/common';
import { TeamService } from './team.service.js';

@Global()
@Module({
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
