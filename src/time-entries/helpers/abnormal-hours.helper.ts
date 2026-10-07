import { DispatchContext } from '../../notifications/notification.types';

/**
 * The context of the `abnormal_hours` alert — written once, used by the
 * create and the update handler. `entity_id` is the employee and the alert is
 * deduped for a day, so editing a 13 h day twice does not alert twice.
 */
export function abnormalHoursContext(
  tenantId: number,
  employee: { id: number; name: string },
  total: { toFixed(digits: number): string },
  workDay: string,
): DispatchContext {
  return {
    tenantId,
    dedupeDays: 1,
    payload: {
      entity_id: employee.id,
      employee_id: employee.id,
      employee_name: employee.name,
      hours: total.toFixed(2),
      date: workDay,
    },
  };
}
