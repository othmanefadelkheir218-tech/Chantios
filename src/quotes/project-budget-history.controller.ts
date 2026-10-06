import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { QuotesService } from './quotes.service';

/**
 * `GET /api/projects/:id/budget-history` lives here, not in `MarginsModule`:
 * `margins` is a leaf module (every cost writer, `quotes` included, imports
 * it), so it cannot import `quotes` back. Same one-directional rule as
 * `project-invoice-coverage.controller.ts`.
 */
@ApiTags('Margins')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('projects')
export class ProjectBudgetHistoryController {
  constructor(private readonly quotesService: QuotesService) {}

  /** The accepted quotes by `accepted_at`, with the running budget. */
  @Get(':id/budget-history')
  @TenantAuth()
  @Module('margins')
  budgetHistory(@Param('id', ParseIntPipe) id: number) {
    return this.quotesService.budgetHistory(id);
  }
}
