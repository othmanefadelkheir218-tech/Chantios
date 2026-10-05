import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAdminUserDto } from './create-admin-user.dto';

/** Name, role and password can change. The email is the login: it stays. */
export class UpdateAdminUserDto extends PartialType(
  OmitType(CreateAdminUserDto, ['email'] as const),
) {}
