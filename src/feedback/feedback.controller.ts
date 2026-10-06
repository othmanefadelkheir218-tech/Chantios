import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiFindFeedback,
  ApiUpdateFeedbackStatus,
} from './decorators/feedback.swagger';
import { FindFeedbackQueryDto } from './dto/find-feedback-query.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('Feedback')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @ApiFindFeedback()
  findAll(@Query() query: FindFeedbackQueryDto) {
    return this.feedbackService.findAll(query);
  }

  @Patch(':id/status')
  @ApiUpdateFeedbackStatus()
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFeedbackStatusDto,
  ) {
    return this.feedbackService.updateStatus(id, dto);
  }
}
