import { BadRequestException } from '@nestjs/common';
import { WORKER_ROLE_ID } from '../../users/helpers/user.helper';
import { CreateDirectMemberDto } from '../dto/create-direct-member.dto';

/**
 * The two allowed shapes of a direct add (doc/notes/auth-tokens.md § 2b).
 * Returns `'password'` (email + temporary password) or `'pin_only'` (worker,
 * no email). Throws `400` with a clear message otherwise.
 */
export function directMemberKind(
  dto: CreateDirectMemberDto,
): 'password' | 'pin_only' {
  const isWorker = dto.role_id === WORKER_ROLE_ID;
  if (dto.pin && !isWorker) {
    throw new BadRequestException('A mobile PIN is only for the worker role');
  }
  if (dto.email) {
    if (!dto.password) {
      throw new BadRequestException(
        'A temporary password is required with an email',
      );
    }
    return 'password';
  }
  if (!isWorker) {
    throw new BadRequestException(
      'Only a worker can be added without an email',
    );
  }
  if (dto.password) {
    throw new BadRequestException(
      'A worker without email logs in with a PIN, not a password',
    );
  }
  if (!dto.pin) {
    throw new BadRequestException('A PIN is required without an email');
  }
  return 'pin_only';
}
