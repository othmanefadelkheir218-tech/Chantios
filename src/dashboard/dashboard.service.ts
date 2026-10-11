import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { GetDashboardHandler } from './handlers/get-dashboard.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class DashboardService {
  constructor(private readonly getDashboard: GetDashboardHandler) {}

  forUser(actor: AuthenticatedUser) {
    return this.getDashboard.execute(actor);
  }
}
