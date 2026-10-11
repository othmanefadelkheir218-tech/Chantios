import { Injectable } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SimulatedPaymentResult } from './dto/simulate-payment.dto';
import { RunJobHandler } from './handlers/run-job.handler';
import { SimulatePaymentHandler } from './handlers/simulate-payment.handler';
import { DEV_JOB_NAMES } from './helpers/dev-jobs.helper';

/** Orchestration only: each method calls the handler that owns the logic. */
@Injectable()
export class DevToolsService {
  constructor(
    private readonly subscriptions: SubscriptionsService,
    private readonly runJob: RunJobHandler,
    private readonly simulatePaymentHandler: SimulatePaymentHandler,
  ) {}

  status() {
    return { enabled: true, jobs: DEV_JOB_NAMES };
  }

  timeTravel(tenantId: number, days: number) {
    return this.subscriptions.shiftDates(tenantId, days);
  }

  run(name: string) {
    return this.runJob.execute(name);
  }

  simulatePayment(tenantId: number, result: SimulatedPaymentResult) {
    return this.simulatePaymentHandler.execute(tenantId, result);
  }
}
