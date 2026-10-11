import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

export const ApiGetDashboard = () =>
  applyDecorators(
    ApiOperation({
      summary: 'What needs my attention today — every widget in one call',
      description:
        'Keys: projects, tasks, hours, quotes, invoices, purchase_invoices, stock, margins. A widget whose module the user cannot view is left out of the response. scope = own narrows tasks and hours to the user. "Today" and "this week" (Monday → today) use the tenant timezone.',
    }),
    ApiOkResponse({
      description: 'The widgets the user may see',
      schema: {
        example: {
          projects: { by_status: { prospect: 2, in_progress: 5 } },
          tasks: { due_today: 3, overdue: 1 },
          hours: { from: '2026-10-05', to: '2026-10-10', total: '38.5' },
          quotes: { count: 4, total_incl_vat: '12100' },
          invoices: {
            unpaid: { count: 6, balance_due: '18150' },
            overdue: { count: 2, balance_due: '4840' },
          },
          purchase_invoices: { days: 7, count: 3, amount_incl_vat: '2420' },
          stock: { low_stock_count: 2 },
          margins: { warning: 1, critical: 0 },
        },
      },
    }),
  );
