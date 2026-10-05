import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { OneTimeCodesService } from '../../one-time-codes/one-time-codes.service';
import { UsersService } from '../../users/users.service';
import { VerifyEmailDto } from '../dto/verify-email.dto';

/**
 * `POST /api/auth/verify-email` — `@Public()`, 24h code. Verifies the
 * registering user's own email (`users.email_verified_at`) — not
 * `tenants.email_verified_at`, which is a separate, admin-initiated flow.
 */
@Injectable()
export class VerifyEmailHandler {
  constructor(
    @InjectPinoLogger(VerifyEmailHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly codes: OneTimeCodesService,
  ) {}

  async execute(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid or expired code');
    }

    const valid = await this.codes.verify(
      'email_verification',
      { userId: user.id },
      dto.code,
    );
    if (!valid) {
      this.logger.warn(`Verify email: wrong/expired code for user ${user.id}`);
      throw new BadRequestException('Invalid or expired code');
    }

    await this.users.setEmailVerified(user.id);
    this.logger.info(`Email verified for user ${user.id}`);
    return { verified: true };
  }
}
