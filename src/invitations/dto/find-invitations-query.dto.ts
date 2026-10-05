import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** `GET /api/invitations` always lists the open ones. */
export class FindInvitationsQueryDto extends PaginationQueryDto {}
