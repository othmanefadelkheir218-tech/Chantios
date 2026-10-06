import { ProjectStatus } from '@prisma/client';

/**
 * The one transition matrix (doc/notes/technical/phase-03-clients-projects.md).
 * Step 06 (quote acceptance) and step 10 (closure) both call `canTransition` —
 * do not re-implement this elsewhere.
 *
 *   prospect     -> in_progress, cancelled
 *   in_progress  -> completed, cancelled
 *   completed    -> in_progress   (admin only — voids the closure snapshot, step 10)
 *   cancelled    -> nothing       (final)
 */
export const PROJECT_STATUS_TRANSITIONS: Record<
  ProjectStatus,
  ProjectStatus[]
> = {
  prospect: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['in_progress'],
  cancelled: [],
};

export function canTransition(from: ProjectStatus, to: ProjectStatus): boolean {
  return PROJECT_STATUS_TRANSITIONS[from].includes(to);
}

/** The one move in the matrix that is admin-only. */
export function isReopen(from: ProjectStatus, to: ProjectStatus): boolean {
  return from === 'completed' && to === 'in_progress';
}
