import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Actor } from '../common/decorators/actor.decorator';
import type { RequestActor } from '../common/decorators/actor.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { ImpersonateEnterHandler } from './handlers/impersonate-enter.handler';
import { ImpersonateExitHandler } from './handlers/impersonate-exit.handler';

/**
 * A platform admin acting as one tenant's own `admin` user, for support
 * (doc/notes/Phaces/16-support-feedback.md). Both routes write an
 * `audit_logs` row — entry and exit — see the handlers for the exact
 * ordering guarantee.
 */
@ApiTags('Admin Auth')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/impersonate')
export class ImpersonateController {
  constructor(
    private readonly enterHandler: ImpersonateEnterHandler,
    private readonly exitHandler: ImpersonateExitHandler,
  ) {}

  @Post(':tenantId')
  enter(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Actor() actor: RequestActor,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.enterHandler.execute(tenantId, actor, res);
  }

  @Delete()
  exit(
    @Req() req: Request,
    @Actor() actor: RequestActor,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.exitHandler.execute(req, actor, res);
  }
}
