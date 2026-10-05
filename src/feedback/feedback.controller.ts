import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiFindFeedback,
  ApiUpdateFeedbackStatus,
} from './decorators/feedback.swagger';
import { FindFeedbackQueryDto } from './dto/find-feedback-query.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('Feedback')
@Public() // TODO: step 02 — AdminAuthGuard (admin staff)
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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeedbackStatusDto,
  ) {
    return this.feedbackService.updateStatus(id, dto);
  }
}
