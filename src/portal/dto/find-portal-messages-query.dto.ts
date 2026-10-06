import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** `GET /api/portal/:token/messages` — paginated, newest first. */
export class FindPortalMessagesQueryDto extends PaginationQueryDto {}
