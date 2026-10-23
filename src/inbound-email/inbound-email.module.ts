import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { EmailConnectionsModule } from '../email-connections/email-connections.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { INBOUND_EMAIL_QUEUE } from './dto/inbound-email-job.dto';
import { ProcessInboundEmailHandler } from './handlers/process-inbound-email.handler';
import { RecordInboundEventHandler } from './handlers/record-inbound-event.handler';
import { InboundEmailController } from './inbound-email.controller';
import { InboundEmailService } from './inbound-email.service';
import { InboundEmailProcessor } from './processors/inbound-email.processor';
import { InboundEmailEventRepository } from './repositories/inbound-email-event.repository';

/**
 * Step 25 — receiving client emails (doc/notes/client-email.md): the Resend
 * webhook, the event store, the queue and the routing. The message itself
 * is written by `chat`; the inbox lookup belongs to `email-connections`.
 */
@Module({
  imports: [
    ChatModule,
    EmailConnectionsModule,
    NotificationsModule,
    BullModule.registerQueue({ name: INBOUND_EMAIL_QUEUE }),
  ],
  controllers: [InboundEmailController],
  providers: [
    InboundEmailService,
    InboundEmailEventRepository,
    RecordInboundEventHandler,
    ProcessInboundEmailHandler,
    InboundEmailProcessor,
  ],
})
export class InboundEmailModule {}
