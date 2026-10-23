import { countReadReceipts, hasReadReceipts } from './read-receipt.helper';

const SENT = new Date('2026-10-20T10:00:00Z');
const BEFORE = new Date('2026-10-01T00:00:00Z');
const AFTER = new Date('2026-10-21T00:00:00Z');

const msg = (over: Record<string, unknown> = {}) => ({
  id: 100,
  senderType: 'employee' as const,
  senderId: 1,
  createdAt: SENT,
  ...over,
});
const member = (userId: number | null, joinedAt = BEFORE) => ({
  userId,
  joinedAt,
});
const read = (messageId: number, userId: number) => ({ messageId, userId });

describe('read-receipt.helper', () => {
  it('ticks only in the team chat', () => {
    expect(hasReadReceipts('internal')).toBe(true);
    expect(hasReadReceipts('support')).toBe(false);
    expect(hasReadReceipts('client')).toBe(false);
    expect(hasReadReceipts('project_client')).toBe(false);
  });

  it('1-to-1: 0 readers, then 1 after the other person reads', () => {
    const members = [member(1), member(2)];
    const active = new Set([1, 2]);
    expect(countReadReceipts([msg()], members, active, []).get(100)).toEqual({
      readCount: 0,
      memberCount: 1,
    });
    expect(
      countReadReceipts([msg()], members, active, [read(100, 2)]).get(100),
    ).toEqual({ readCount: 1, memberCount: 1 });
  });

  it('group of 6: two readers -> "2/5"', () => {
    const members = [1, 2, 3, 4, 5, 6].map((id) => member(id));
    const result = countReadReceipts(
      [msg()],
      members,
      new Set([1, 2, 3, 4, 5, 6]),
      [read(100, 2), read(100, 5)],
    );
    expect(result.get(100)).toEqual({ readCount: 2, memberCount: 5 });
  });

  it('the sender never counts, even with a read row', () => {
    const result = countReadReceipts(
      [msg()],
      [member(1), member(2), member(3)],
      new Set([1, 2, 3]),
      [read(100, 1)],
    );
    expect(result.get(100)).toEqual({ readCount: 0, memberCount: 2 });
  });

  it('a member added after the message never counts, even if they read it', () => {
    const result = countReadReceipts(
      [msg()],
      [member(1), member(2), member(3, AFTER)],
      new Set([1, 2, 3]),
      [read(100, 3)],
    );
    expect(result.get(100)).toEqual({ readCount: 0, memberCount: 1 });
  });

  it('a deactivated user never counts', () => {
    const result = countReadReceipts(
      [msg()],
      [member(1), member(2), member(3)],
      new Set([1, 2]),
      [read(100, 2), read(100, 3)],
    );
    expect(result.get(100)).toEqual({ readCount: 1, memberCount: 1 });
  });

  it('a read of ANOTHER message, a client or an admin member never counts', () => {
    const result = countReadReceipts(
      [msg(), msg({ id: 101, senderType: 'client' })],
      [member(1), member(2), member(null)],
      new Set([1, 2]),
      [read(999, 2)],
    );
    expect(result.get(100)).toEqual({ readCount: 0, memberCount: 1 });
    expect(result.has(101)).toBe(false);
  });
});
