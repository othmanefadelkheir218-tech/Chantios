import { SetPendingPlanDto } from '../../subscriptions/dto/set-pending-plan.dto';

/**
 * `POST /api/billing/change-plan` — same shape as the admin's manual plan
 * move (`plan_id` only): the storage downgrade gate runs first
 * (`request-downgrade.handler.ts`), then the SAME pending-plan mechanism
 * `SubscriptionsService.changePlan` already implements takes over. No new
 * fields to validate, so this just names the contract for this route.
 */
export class ChangePlanDto extends SetPendingPlanDto {}
