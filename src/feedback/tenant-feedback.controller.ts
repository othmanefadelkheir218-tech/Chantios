import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

/**
 * The tenant side (step 16) of feedback — `feedback.controller.ts` is the
 * platform's `admin/feedback` twin (step 01), same two-controller split as
 * `portal`/`notifications`. No `@Roles`/`@Module`: any authenticated tenant
 * user may submit feedback.
 */
@ApiTags('Feedback')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('feedback')
export class TenantFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @TenantAuth()
  create(
    @Body() dto: CreateFeedbackDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.feedbackService.create(dto, actor);
  }

  @Get('mine')
  @TenantAuth()
  findMine(@Query() query: PaginationQueryDto) {
    return this.feedbackService.findMine(query);
  }
}
