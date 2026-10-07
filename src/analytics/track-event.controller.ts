import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';

/**
 * The tenant side (step 16) — `analytics.controller.ts` is the platform's
 * `admin/analytics` twin (step 01), same two-controller split as
 * `portal`/`notifications`. `AuthGuard` only: any authenticated tenant user
 * may track an event, no `@Roles`/`@Module`. Fire-and-forget: `202`
 * immediately, whatever the state of the analytics queue — see
 * `AnalyticsService.track()`.
 */
@ApiTags('Analytics')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('analytics')
export class TrackEventController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @HttpCode(202)
  @TenantAuth()
  track(
    @Body() dto: TrackEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): { accepted: true } {
    this.analyticsService.trackEvent(dto, actor);
    return { accepted: true };
  }
}
