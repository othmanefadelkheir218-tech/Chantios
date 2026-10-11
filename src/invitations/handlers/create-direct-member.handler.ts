import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { hashPassword } from '../../common/helpers/password.helper';
import { randomLoginCode, toUserEntity } from '../../users/helpers/user.helper';
import { UsersService } from '../../users/users.service';
import { CreateDirectMemberDto } from '../dto/create-direct-member.dto';
import { directMemberKind } from '../helpers/direct-member.helper';
import { assertEmailFreeForInvitation } from '../helpers/invitation-email.helper';
import { InvitationRepository } from '../repositories/invitation.repository';

/** Tries before giving up on a free login code (10^8 codes — a clash is rare). */
const LOGIN_CODE_TRIES = 5;

/**
 * `POST /api/invitations/direct` — admin only. Creates the `users` row at
 * once, no email sent (doc/notes/auth-tokens.md § 2b):
 * - email + temporary password → `must_change_password = true`;
 * - worker without email → PIN + a unique 8-digit login code.
 * The email must be free exactly like an invitation; an open invitation of
 * the same email at this company is replaced (deleted).
 */
@Injectable()
export class CreateDirectMemberHandler {
  constructor(
    @InjectPinoLogger(CreateDirectMemberHandler.name)
    private readonly logger: PinoLogger,
    private readonly invitations: InvitationRepository,
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateDirectMemberDto, actor: AuthenticatedUser) {
    const kind = directMemberKind(dto);
    const email = dto.email?.toLowerCase();
    this.logger.info(`Adding a member directly (${kind}, role ${dto.role_id})`);

    if (email) {
      const existing = await assertEmailFreeForInvitation(
        email,
        actor.tenantId,
        {
          findUserByEmail: (value) => this.users.findByEmail(value),
          findOpenInvitationAnywhere: (value) =>
            this.invitations.findOpenByEmailAnywhere(value),
        },
      );
      if (existing) {
        this.logger.info(`Replacing the open invitation of ${email}`);
        await this.invitations.delete(existing.id);
      }
    }

    // Scalar FKs only (`roleId`), same reason as accept-invitation.handler.
    const user = await this.users.create({
      name: dto.name,
      email: email ?? null,
      roleId: dto.role_id,
      phone: dto.phone ?? null,
      ...(dto.hourly_rate !== undefined && { hourlyRate: dto.hourly_rate }),
      ...(dto.password && {
        passwordHash: await hashPassword(dto.password),
        mustChangePassword: true,
      }),
      ...(dto.pin && { mobilePinHash: await hashPassword(dto.pin) }),
      ...(kind === 'pin_only' && { loginCode: await this.freeLoginCode() }),
    } as unknown as Prisma.UserCreateInput);

    const entity = toUserEntity(user);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'user',
      entityId: user.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Member added directly: user ${user.id}`);
    return entity;
  }

  private async freeLoginCode(): Promise<string> {
    for (let i = 0; i < LOGIN_CODE_TRIES; i++) {
      const code = randomLoginCode();
      if (!(await this.users.findByLoginCode(code))) return code;
    }
    this.logger.error('No free login code found');
    throw new ConflictException('Could not create a login code, try again');
  }
}
