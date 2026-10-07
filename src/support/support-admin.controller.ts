import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { Actor } from '../common/decorators/actor.decorator';
import type { RequestActor } from '../common/decorators/actor.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { FindTicketsQueryDto } from './dto/find-tickets-query.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { SupportService } from './support.service';

/** The platform side, as with `portal`/`notifications`: `support.controller.ts` is the tenant twin. */
@ApiTags('Support')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/support/tickets')
export class SupportAdminController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  findAll(@Query() query: FindTicketsQueryDto) {
    return this.supportService.findAllForAdmin(query);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketStatusDto,
    @Actor() actor: RequestActor,
  ) {
    return this.supportService.updateStatus(id, dto, actor);
  }

  @Patch(':id/assign')
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTicketDto,
    @Actor() actor: RequestActor,
  ) {
    return this.supportService.assign(id, dto, actor);
  }

  @Patch(':id/close')
  close(@Param('id', ParseIntPipe) id: number, @Actor() actor: RequestActor) {
    return this.supportService.close(id, actor);
  }
}
