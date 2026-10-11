import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

export const ApiGetAdminStats = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Platform numbers for the admin home page (admin staff)',
      description:
        'Deleted companies are left out everywhere. growth = new companies per month, last 12 months (Brussels time), oldest first. plan_split = live companies not cancelled, per plan name (old plan versions added together), biggest first. support.open = tickets not closed.',
    }),
    ApiOkResponse({
      description: 'The platform stats',
      schema: {
        example: {
          tenants: { total: 12, active: 10, suspended: 1, banned: 1 },
          subscriptions: { trialing: 3, active: 7, past_due: 1, cancelled: 1 },
          support: { open: 4, high_priority: 1 },
          feedback: { new: 2 },
          growth: [{ month: '2026-10', new_tenants: 3 }],
          plan_split: [{ plan_name: 'Pro', tenants: 6 }],
        },
      },
    }),
  );
