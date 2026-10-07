import { DispatchContext } from '../../notifications/notification.types';

/**
 * The context of the three worker alerts about a task (`task_assigned`,
 * `task_status_changed`, `task_starting`) — written once. The people who
 * must hear about it are explicit; the one who made the change is left out.
 */
export function taskAlertContext(
  tenantId: number,
  task: { id: number; title: string },
  projectName: string,
  userIds: number[],
  extra: Record<string, unknown> = {},
  excludeUserId?: number,
): DispatchContext {
  return {
    tenantId,
    userIds,
    excludeUserIds: excludeUserId ? [excludeUserId] : [],
    payload: {
      entity_id: task.id,
      task_id: task.id,
      task_title: task.title,
      project_name: projectName,
      ...extra,
    },
  };
}
