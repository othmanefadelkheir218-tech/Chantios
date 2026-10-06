import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { Public } from '../common/decorators/public.decorator';
import { PortalContext } from './decorators/portal-context.decorator';
import type { PortalContextData } from './decorators/portal-context.decorator';
import { FindPortalMessagesQueryDto } from './dto/find-portal-messages-query.dto';
import { PortalMessageDto } from './dto/portal-message.dto';
import { PortalTokenGuard } from './guards/portal-token.guard';
import { PortalHeadersInterceptor } from './interceptors/portal-headers.interceptor';
import { PortalService } from './portal.service';

/**
 * The CLIENT side of the portal: no login, the URL is the key. `@Public()` at
 * the Nest level — `PortalTokenGuard` is the ONLY gate (the three checks, then
 * the token's `tenant_id` into `nestjs-cls`). Rate-limited: the token travels
 * in the URL and will end up in logs and browser history.
 *
 * Every route works on the token's own project and client; none takes a
 * project, client or tenant id from the caller.
 */
@ApiTags('Portal (client)')
@Public()
@UseGuards(PortalTokenGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
@UseInterceptors(PortalHeadersInterceptor, SnakeCaseInterceptor)
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  /** The overview — project, progress %, counts. Writes a `view` event. */
  @Get(':token')
  overview(@PortalContext() portal: PortalContextData) {
    return this.portalService.getOverview(portal);
  }

  /** `sent` and `accepted` quotes only. */
  @Get(':token/quotes')
  quotes(@PortalContext() portal: PortalContextData) {
    return this.portalService.getQuotes(portal);
  }

  /** The client's only write: the SAME handler staff use. */
  @Post(':token/quotes/:id/accept')
  accept(
    @PortalContext() portal: PortalContextData,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.portalService.accept(portal, id);
  }

  @Post(':token/quotes/:id/refuse')
  refuse(
    @PortalContext() portal: PortalContextData,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.portalService.refuse(portal, id);
  }

  /** `sent`, `partially_paid` and `paid` only; a late one carries the late label. */
  @Get(':token/invoices')
  invoices(@PortalContext() portal: PortalContextData) {
    return this.portalService.getInvoices(portal);
  }

  /** The frozen PDF — writes a `download` event, then redirects to the file. */
  @Get(':token/documents/:mediaId')
  async document(
    @PortalContext() portal: PortalContextData,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Res() res: Response,
  ): Promise<void> {
    const url = await this.portalService.documentUrl(portal, mediaId);
    res.redirect(302, url);
  }

  @Get(':token/messages')
  messages(
    @PortalContext() portal: PortalContextData,
    @Query() query: FindPortalMessagesQueryDto,
  ) {
    return this.portalService.getMessages(portal, query);
  }

  /** `sender_type = 'client'`, the sender is the token's client. */
  @Post(':token/messages')
  postMessage(
    @PortalContext() portal: PortalContextData,
    @Body() dto: PortalMessageDto,
  ) {
    return this.portalService.postMessage(portal, dto);
  }
}
