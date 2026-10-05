import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  hashPassword,
  verifyPassword,
} from '../../common/helpers/password.helper';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { ChangePasswordDto } from '../dto/change-password.dto';

/** `POST /api/auth/change-password` — `AuthGuard`. Old + new. */
@Injectable()
export class ChangePasswordHandler {
  constructor(
    @InjectPinoLogger(ChangePasswordHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
  ) {}

  async execute(dto: ChangePasswordDto, actor: AuthenticatedUser) {
    const user = await this.users.findByIdRaw(actor.userId);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Not authenticated');
    }

    if (!(await verifyPassword(user.passwordHash, dto.old_password))) {
      this.logger.warn(
        `Change password: wrong old password for user ${user.id}`,
      );
      throw new BadRequestException('The current password is wrong');
    }

    const passwordHash = await hashPassword(dto.new_password);
    await this.users.setPasswordHash(user.id, passwordHash);

    this.logger.info(`Password changed for user ${user.id}`);
    return { changed: true };
  }
}
