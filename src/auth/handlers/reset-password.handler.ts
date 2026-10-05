import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { hashPassword } from '../../common/helpers/password.helper';
import { OneTimeCodesService } from '../../one-time-codes/one-time-codes.service';
import { SessionsService } from '../../sessions/sessions.service';
import { UsersService } from '../../users/users.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';

/** `POST /api/auth/reset-password` — consumes the code, sets the new hash, revokes every session. */
@Injectable()
export class ResetPasswordHandler {
  constructor(
    @InjectPinoLogger(ResetPasswordHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly codes: OneTimeCodesService,
    private readonly sessions: SessionsService,
  ) {}

  async execute(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user) {
      this.logger.warn(`Reset password: ${email} not found`);
      throw new BadRequestException('Invalid or expired code');
    }

    const valid = await this.codes.verify(
      'password_reset',
      { userId: user.id },
      dto.code,
    );
    if (!valid) {
      this.logger.warn(
        `Reset password: wrong/expired code for user ${user.id}`,
      );
      throw new BadRequestException('Invalid or expired code');
    }

    const passwordHash = await hashPassword(dto.password);
    await this.users.setPasswordHash(user.id, passwordHash);
    await this.sessions.revokeAllForUser(user.id);

    this.logger.info(
      `Password reset for user ${user.id}, every session revoked`,
    );
    return { reset: true };
  }
}
