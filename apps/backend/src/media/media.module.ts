import { Global, Module } from '@nestjs/common';
import { MediaStorage } from './media-storage.js';
import { MediaService } from './media.service.js';

@Global()
@Module({
  providers: [MediaStorage, MediaService],
  exports: [MediaStorage, MediaService],
})
export class MediaModule {}
