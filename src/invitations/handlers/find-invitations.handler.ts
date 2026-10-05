import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindInvitationsQueryDto } from '../dto/find-invitations-query.dto';
import { toInvitationEntity } from '../helpers/invitation.helper';
import { InvitationRepository } from '../repositories/invitation.repository';

@Injectable()
export class FindInvitationsHandler {
  constructor(
    @InjectPinoLogger(FindInvitationsHandler.name)
    private readonly logger: PinoLogger,
    private readonly invitations: InvitationRepository,
  ) {}

  async execute({ page, limit }: FindInvitationsQueryDto) {
    this.logger.debug(
      `Listing open invitations (page ${page}, limit ${limit})`,
    );

    const [data, total] = await this.invitations.findMany(
      { acceptedAt: null, expiresAt: { gt: new Date() } },
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toInvitationEntity), total, page, limit);
  }
}
