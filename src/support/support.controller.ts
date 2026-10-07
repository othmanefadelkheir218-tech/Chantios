import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SupportService } from './support.service';

/** The tenant side, as with `portal`/`notifications`: `support-admin.controller.ts` is the platform twin. */
@ApiTags('Support')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /** Admin only — auto-creates the `support` conversation, one transaction. */
  @Post()
  @TenantAuth()
  @Roles('admin')
  create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.supportService.create(dto, actor);
  }

  /** Any authenticated tenant user — own tenant only, structurally. */
  @Get()
  @TenantAuth()
  findAll(@Query() query: PaginationQueryDto) {
    return this.supportService.findAll(query);
  }

  @Get(':id')
  @TenantAuth()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supportService.findOne(id);
  }
}
