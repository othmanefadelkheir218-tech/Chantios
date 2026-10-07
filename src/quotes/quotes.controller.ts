import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { FindQuotesQueryDto } from './dto/find-quotes-query.dto';
import { SetQuoteLinesDto } from './dto/set-quote-lines.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuotesService } from './quotes.service';

@ApiTags('Quotes')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @TenantAuth()
  @Module('quotes')
  create(@Body() dto: CreateQuoteDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.quotesService.create(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('quotes')
  findAll(@Query() query: FindQuotesQueryDto) {
    return this.quotesService.findAll(query);
  }

  @Get(':id')
  @TenantAuth()
  @Module('quotes')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quotesService.findOne(id);
  }

  /**
   * `draft` -> streams the rendered PDF bytes directly. `sent`+ -> a `302`
   * to the frozen file's CDN URL (same pattern as the portal's document
   * route). `@Res()` without `passthrough`, same as
   * `PortalController#document`: the binary body must never pass through
   * `SnakeCaseInterceptor`, which would try to turn a `Buffer`'s own
   * numeric-indexed bytes into object keys.
   */
  @Get(':id/pdf')
  @TenantAuth()
  @Module('quotes')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.quotesService.renderPdf(id, actor);
    if (result.mode === 'redirect') {
      res.redirect(302, result.url);
      return;
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${result.filename}"`,
    });
    res.send(result.buffer);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('quotes')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuoteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.quotesService.update(id, dto, actor);
  }

  @Put(':id/lines')
  @TenantAuth()
  @Module('quotes')
  setLines(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetQuoteLinesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.quotesService.replaceLines(id, dto, actor);
  }

  @Post(':id/send')
  @TenantAuth()
  @Module('quotes')
  send(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.quotesService.send(id, actor);
  }

  /** Staff accepting by phone. The step 12 client-portal route calls the same service method. */
  @Post(':id/accept')
  @TenantAuth()
  @Module('quotes')
  accept(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.quotesService.accept(id, actor);
  }

  @Post(':id/refuse')
  @TenantAuth()
  @Module('quotes')
  refuse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.quotesService.refuse(id, actor);
  }
}
