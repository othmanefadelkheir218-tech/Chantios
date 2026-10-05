import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindUsersQueryDto } from '../dto/find-users-query.dto';
import { buildUserFilter, toUserEntity } from '../helpers/user.helper';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class FindUsersHandler {
  constructor(
    @InjectPinoLogger(FindUsersHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UserRepository,
  ) {}

  async execute({
    page,
    limit,
    search,
    role_id,
    is_active,
  }: FindUsersQueryDto) {
    this.logger.debug(`Listing users (page ${page}, limit ${limit})`);

    const [data, total] = await this.users.findMany(
      buildUserFilter(search, role_id, is_active),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toUserEntity), total, page, limit);
  }
}
