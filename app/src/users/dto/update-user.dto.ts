import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/** All fields are optional. Only the sent fields are updated. */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
