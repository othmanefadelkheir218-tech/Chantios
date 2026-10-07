import { Global, Module } from '@nestjs/common';
import { AppEventsService } from './app-events.service';

/** Global, like the tenant context: any module may emit, any module may listen. */
@Global()
@Module({
  providers: [AppEventsService],
  exports: [AppEventsService],
})
export class CommonEventsModule {}
