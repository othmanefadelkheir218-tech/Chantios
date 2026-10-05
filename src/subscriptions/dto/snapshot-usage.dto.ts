/**
 * Input of `SubscriptionsService.snapshotUsage()`. There is no route for it:
 * the renewal job (step 14) counts the usage and calls the service.
 */
export interface SnapshotUsageInput {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  /** Real usage per dimension, e.g. `{ max_workers: 7, storage_gb: 12.4 }`. */
  usage: Record<string, number>;
}
