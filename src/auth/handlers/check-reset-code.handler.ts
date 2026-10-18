import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { OneTimeCodesService } from '../../one-time-codes/one-time-codes.service';
import { UsersService } from '../../users/users.service';
import { CheckResetCodeDto } from '../dto/check-reset-code.dto';

/**
 * `POST /api/auth/check-reset-code` — tells the reset form the code is right,
 * WITHOUT using it. A wrong code counts as one try (same limit of 5).
 */
@Injectable()
export class CheckResetCodeHandler {
  constructor(
    @InjectPinoLogger(CheckResetCodeHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly codes: OneTimeCodesService,
  ) {}

  async execute(dto: CheckResetCodeDto) {
    const email = dto.email.toLowerCase();
    const user = await this.users.findByEmail(email);
    const valid =
      !!user &&
      (await this.codes.check('password_reset', { userId: user.id }, dto.code));
    if (!valid) {
      this.logger.warn(`Check reset code: wrong/expired code for ${email}`);
      throw new BadRequestException('Invalid or expired code');
    }
    return { valid: true };
  }
}
