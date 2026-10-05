import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindAdminUsersQueryDto } from '../dto/find-admin-users-query.dto';
import {
  buildAdminUserFilter,
  toAdminUserEntity,
} from '../helpers/admin-user.helper';
import { AdminUserRepository } from '../repositories/admin-user.repository';

@Injectable()
export class FindAdminUsersHandler {
  constructor(
    @InjectPinoLogger(FindAdminUsersHandler.name)
    private readonly logger: PinoLogger,
    private readonly admins: AdminUserRepository,
  ) {}

  async execute({ page, limit, search }: FindAdminUsersQueryDto) {
    this.logger.debug(`Listing admin users (page ${page}, limit ${limit})`);

    const [data, total] = await this.admins.findMany(
      buildAdminUserFilter(search),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toAdminUserEntity), total, page, limit);
  }
}
