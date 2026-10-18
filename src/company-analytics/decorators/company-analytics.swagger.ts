import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

export const ApiGetCompanyAnalytics = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'How the company is doing over a period — every block in one call',
      description:
        'Needs analytics:view. Blocks: revenue, aging, top_clients (invoices), margins (margins), quotes (quotes), hours (time_entries, scope own = own hours), purchases (purchase_invoices). A block whose module the user cannot view is left out. Every month of the period is in each by_month, an empty month is 0. aging and margins are a picture of now, not of the period. Money incl. VAT, margins excl. VAT.',
    }),
    ApiOkResponse({
      description: 'The period and the blocks the user may see',
      schema: {
        example: {
          period: {
            from: '2026-09-01',
            to: '2026-10-17',
            months: ['2026-09', '2026-10'],
          },
          revenue: {
            invoiced: '12100',
            collected: '6050',
            by_month: [
              { month: '2026-09', invoiced: '12100', collected: '0' },
              { month: '2026-10', invoiced: '0', collected: '6050' },
            ],
          },
          aging: {
            buckets: [
              { bucket: 'not_due', count: 1, balance_due: '6050' },
              { bucket: 'late_1_30', count: 0, balance_due: '0' },
              { bucket: 'late_31_60', count: 0, balance_due: '0' },
              { bucket: 'late_60_plus', count: 0, balance_due: '0' },
            ],
            total: { count: 1, balance_due: '6050' },
          },
          top_clients: [
            {
              client_id: 3,
              name: 'SCI Les Acacias',
              invoiced: '12100',
              collected: '6050',
              collected_pct: '50',
            },
          ],
          margins: {
            average_pct: '24.5',
            project_count: 4,
            best: [],
            worst: [],
          },
          quotes: {
            sent: 7,
            accepted: 2,
            refused: 1,
            waiting: 4,
            conversion_pct: '28.6',
            by_month: [{ month: '2026-09', sent: 4, accepted: 1, refused: 0 }],
          },
          hours: {
            total: '312.5',
            by_month: [{ month: '2026-09', hours: '160' }],
            by_project: [
              { project_id: 8, name: 'Rénovation Dubois', hours: '120' },
            ],
          },
          purchases: {
            total: '4235',
            by_month: [{ month: '2026-09', amount: '4235' }],
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'from after to, a bad date, or more than 24 months',
    }),
  );
