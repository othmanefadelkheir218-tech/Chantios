/** Result of a startup check for one service (database, redis, swagger...). */
export interface ServiceStatus {
  name: string;
  ok: boolean;
  detail: string;
}

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Prints the connection status of every service.
 * To show a new service at startup: create its `xxx.config.ts` that returns a
 * ServiceStatus, then add it to the list in main.ts.
 */
export function printStatus(statuses: ServiceStatus[]) {
  const width = Math.max(...statuses.map((s) => s.name.length)) + 2;
  const rows = statuses.map(
    (s) => `  ${s.ok ? '✓' : '✗'} ${s.name.padEnd(width)}${s.detail}`,
  );
  console.log(`\n  CONNECTION STATUS:\n\n${rows.join('\n')}\n`);
}
