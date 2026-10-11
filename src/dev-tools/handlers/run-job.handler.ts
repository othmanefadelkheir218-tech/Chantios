import { Injectable, NotFoundException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DEV_JOBS } from '../helpers/dev-jobs.helper';

/**
 * Runs one nightly job now. The job classes live in their own modules and are
 * not exported; `ModuleRef` with `strict: false` finds the one instance the
 * scheduler already uses — dev tools only, never a pattern for business code.
 * `billing-renewal` queues its jobs on BullMQ: they finish a moment later.
 */
@Injectable()
export class RunJobHandler {
  constructor(
    @InjectPinoLogger(RunJobHandler.name)
    private readonly logger: PinoLogger,
    private readonly moduleRef: ModuleRef,
  ) {}

  async execute(name: string) {
    const jobClass = DEV_JOBS[name];
    if (!jobClass) {
      throw new NotFoundException(`Unknown job: ${name}`);
    }
    this.logger.warn(`DEV TOOLS: running job ${name} now`);
    const job = this.moduleRef.get(jobClass, { strict: false });
    const result = await job.run();
    this.logger.info(`DEV TOOLS: job ${name} done`);
    return { job: name, result };
  }
}
