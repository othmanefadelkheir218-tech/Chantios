import { Module } from '@nestjs/common';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { SessionsService } from './sessions.service';

@Module({
  providers: [SessionsService, RefreshTokenRepository],
  exports: [SessionsService],
})
export class SessionsModule {}
