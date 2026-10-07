import {
  StaffCandidate,
  filterStaffRecipients,
  recipientRule,
} from './notification-recipients.helper';
import { renderNotification } from './notification-templates.helper';
import {
  CLIENT_EMAIL_TYPES,
  NotificationType,
  PLATFORM_ALERT_TYPES,
  TENANT_ALERT_TYPES,
} from '../notification.types';

const user = (id: number, roleName: string, roleId = id): StaffCandidate => ({
  id,
  email: `u${id}@test.local`,
  name: `User ${id}`,
  roleId,
  roleName,
});

const override = (
  module: string,
  canView: boolean,
): {
  module: never;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  scope: 'all';
} => ({
  module: module as never,
  canView,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  scope: 'all',
});

describe('recipientRule — who gets what, in ONE place', () => {
  it('every alert type has a rule', () => {
    const all: NotificationType[] = [
      ...TENANT_ALERT_TYPES,
      ...PLATFORM_ALERT_TYPES,
      ...CLIENT_EMAIL_TYPES,
    ];
    for (const type of all) {
      expect(recipientRule(type).kind).toBeDefined();
    }
  });

  it('stock, margin, time, project and report alerts go to staff, keyed by a module', () => {
    expect(recipientRule('low_stock')).toEqual({
      kind: 'staff',
      module: 'stock',
    });
    expect(recipientRule('margin_critical')).toEqual({
      kind: 'staff',
      module: 'margins',
    });
    expect(recipientRule('abnormal_hours')).toEqual({
      kind: 'staff',
      module: 'time_entries',
    });
    expect(recipientRule('missing_report')).toEqual({
      kind: 'staff',
      module: 'reports',
    });
  });

  it('billing alerts are keyed by a billing module', () => {
    expect(recipientRule('invoice_late')).toEqual({
      kind: 'staff',
      module: 'invoices',
    });
    expect(recipientRule('invoice_paid')).toEqual({
      kind: 'staff',
      module: 'invoices',
    });
    expect(recipientRule('purchase_due')).toEqual({
      kind: 'staff',
      module: 'purchase_invoices',
    });
  });

  it('worker and conversation alerts name their people', () => {
    for (const type of [
      'task_assigned',
      'task_starting',
      'task_status_changed',
      'end_of_day_reminder',
      'new_message',
      'support_reply',
    ] as const) {
      expect(recipientRule(type)).toEqual({ kind: 'explicit' });
    }
  });

  it('platform and client types', () => {
    for (const type of PLATFORM_ALERT_TYPES) {
      expect(recipientRule(type)).toEqual({ kind: 'platform' });
    }
    for (const type of CLIENT_EMAIL_TYPES) {
      expect(recipientRule(type)).toEqual({ kind: 'client' });
    }
  });
});

describe('filterStaffRecipients', () => {
  const people = [
    user(1, 'admin'),
    user(2, 'manager'),
    user(3, 'worker'),
    user(4, 'accountant'),
  ];

  it('admin + manager get a project alert; a worker and an accountant do not', () => {
    const ids = filterStaffRecipients(people, 'stock', new Map()).map(
      (u) => u.id,
    );
    expect(ids).toEqual([1, 2]);
  });

  it('the manager is skipped for a billing alert (no invoices access by default)', () => {
    const ids = filterStaffRecipients(people, 'invoices', new Map()).map(
      (u) => u.id,
    );
    expect(ids).toEqual([1]);
  });

  it('a role_permissions override gives the manager the billing alerts', () => {
    const ids = filterStaffRecipients(
      people,
      'invoices',
      new Map([[2, [override('invoices', true)]]]),
    ).map((u) => u.id);
    expect(ids).toEqual([1, 2]);
  });

  it('an override can also take an alert away from the manager', () => {
    const ids = filterStaffRecipients(
      people,
      'stock',
      new Map([[2, [override('stock', false)]]]),
    ).map((u) => u.id);
    expect(ids).toEqual([1]);
  });

  it('an override on ANOTHER module changes nothing', () => {
    const ids = filterStaffRecipients(
      people,
      'stock',
      new Map([[2, [override('invoices', false)]]]),
    ).map((u) => u.id);
    expect(ids).toEqual([1, 2]);
  });
});

describe('renderNotification', () => {
  const payload = { material_name: 'Paint', on_hand: '4', unit: 'L' };

  it('renders every type in every locale without throwing', () => {
    const all: NotificationType[] = [
      ...TENANT_ALERT_TYPES,
      ...PLATFORM_ALERT_TYPES,
      ...CLIENT_EMAIL_TYPES,
    ];
    for (const type of all) {
      for (const locale of ['fr', 'en', 'ar', 'de', undefined, null]) {
        const out = renderNotification(type, {}, locale);
        expect(out.subject.length).toBeGreaterThan(0);
        expect(out.html).toContain(out.subject);
      }
    }
  });

  it('uses the requested locale', () => {
    expect(renderNotification('low_stock', payload, 'en').subject).toBe(
      'Low stock: Paint',
    );
    expect(renderNotification('low_stock', payload, 'fr').subject).toBe(
      'Stock bas : Paint',
    );
    expect(renderNotification('low_stock', payload, 'ar').subject).toContain(
      'Paint',
    );
  });

  it('an unknown locale falls back to English', () => {
    expect(renderNotification('low_stock', payload, 'de').subject).toBe(
      'Low stock: Paint',
    );
  });

  it('platform alerts exist in English only, whatever the locale asked', () => {
    const out = renderNotification(
      'tenant_signed_up',
      { company_name: 'Dupont' },
      'fr',
    );
    expect(out.subject).toBe('New company: Dupont');
  });

  it('escapes what a user typed (a project name cannot inject HTML)', () => {
    const out = renderNotification(
      'margin_warning',
      { project_name: '<script>alert(1)</script>', cost_pct: '81' },
      'en',
    );
    expect(out.html).not.toContain('<script>');
    expect(out.html).toContain('&lt;script&gt;');
  });

  it('a client email carries the portal link only when there is one', () => {
    const withLink = renderNotification(
      'client_quote_sent',
      { company_name: 'Dupont', quote_ref: 'Q-1', portal_url: 'https://x/p/t' },
      'en',
    );
    expect(withLink.body).toContain('https://x/p/t');
    const without = renderNotification(
      'client_quote_sent',
      { company_name: 'Dupont', quote_ref: 'Q-1' },
      'en',
    );
    expect(without.body).not.toContain('href');
  });
});
