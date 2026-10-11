import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { ApiFindPublicPlans } from './decorators/plans.swagger';
import { PlansService } from './plans.service';

/** Read-only, no login: feeds the public pricing page. Plans change only through `/api/admin/plans`. */
@ApiTags('Plans (public)')
@Public()
@UseInterceptors(SnakeCaseInterceptor)
@Controller('plans')
export class PlansPublicController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiFindPublicPlans()
  findAll() {
    return this.plansService.findPublic();
  }
}
