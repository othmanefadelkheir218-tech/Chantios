import { Injectable } from '@nestjs/common';
import { GetAdminStatsHandler } from './handlers/get-admin-stats.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class AdminStatsService {
  constructor(private readonly getAdminStats: GetAdminStatsHandler) {}

  find() {
    return this.getAdminStats.execute();
  }
}
