/** One product event. Sent by other modules through `AnalyticsService.track()`. */
export interface TrackEventInput {
  tenantId: number;
  userId?: number | null;
  /** snake_case verb phrase, e.g. `quote_sent`. */
  eventName: string;
  payload?: Record<string, unknown>;
}

/** Name of the BullMQ queue that carries the events. */
export const ANALYTICS_QUEUE = 'analytics';
