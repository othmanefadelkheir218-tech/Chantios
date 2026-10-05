import { Module } from '@nestjs/common';
import { OneTimeCodesService } from './one-time-codes.service';
import { OneTimeCodeRepository } from './repositories/one-time-code.repository';

@Module({
  providers: [OneTimeCodesService, OneTimeCodeRepository],
  exports: [OneTimeCodesService],
})
export class OneTimeCodesModule {}
