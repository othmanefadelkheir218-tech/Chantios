/**
 * The project tag of an email topic (doc/notes/client-email.md § The project
 * tag), in this order:
 *
 *   1. a reply in an existing topic keeps the topic's tag (nothing to decide);
 *   2. a topic started from a project → that project;
 *   3. a portal message → the project of the portal link;
 *   4. the client opens a new topic → 0 open projects or unknown sender: none;
 *      1 open project: SUGGESTED; 2+: none, and the alert asks to link it.
 *
 * A staff email started without a project has no tag. The tag can always be
 * changed later (`set-topic-project`).
 */
export type TopicTagInput =
  | { kind: 'from_project'; projectId: number }
  | { kind: 'portal'; projectId: number }
  | { kind: 'staff_no_project' }
  | { kind: 'client_new_topic'; openProjectIds: number[] };

export interface TopicTag {
  projectId: number | null;
  /** true = set by the "1 open project" rule, waiting for a user to confirm. */
  suggested: boolean;
  /** true = the client has 2+ open projects: the alert asks to link it. */
  needsProject: boolean;
}

export function decideTopicTag(input: TopicTagInput): TopicTag {
  switch (input.kind) {
    case 'from_project':
    case 'portal':
      return {
        projectId: input.projectId,
        suggested: false,
        needsProject: false,
      };
    case 'staff_no_project':
      return { projectId: null, suggested: false, needsProject: false };
    case 'client_new_topic': {
      const open = [...new Set(input.openProjectIds)];
      if (open.length === 1) {
        return { projectId: open[0], suggested: true, needsProject: false };
      }
      return {
        projectId: null,
        suggested: false,
        needsProject: open.length > 1,
      };
    }
  }
}
