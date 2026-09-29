import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { FindUsersQueryDto } from '../dto/find-users-query.dto';
import { buildUserSearchFilter, toPaginated } from '../helpers/users.helper';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class FindUsersHandler {
  constructor(
    @InjectPinoLogger(FindUsersHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UserRepository,
  ) {}

  async execute({ page, limit, search }: FindUsersQueryDto) {
    this.logger.debug(`Listing users (page ${page}, limit ${limit})`);

    const [data, total] = await this.users.findMany(
      buildUserSearchFilter(search),
      (page - 1) * limit,
      limit,
    );
    return toPaginated(data, total, page, limit);
  }
}
