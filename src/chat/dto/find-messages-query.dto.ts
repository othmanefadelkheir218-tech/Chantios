import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** `GET /api/conversations/:id/messages` — paginated, newest first. */
export class FindMessagesQueryDto extends PaginationQueryDto {}
