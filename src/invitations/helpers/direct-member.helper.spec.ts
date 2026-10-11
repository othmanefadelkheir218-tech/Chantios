import { BadRequestException } from '@nestjs/common';
import { CreateDirectMemberDto } from '../dto/create-direct-member.dto';
import { directMemberKind } from './direct-member.helper';

const dto = (over: Partial<CreateDirectMemberDto>): CreateDirectMemberDto => ({
  name: 'Jean',
  role_id: 5,
  ...over,
});

describe('directMemberKind (auth-tokens.md § 2b)', () => {
  it('email + temporary password, any role', () => {
    expect(
      directMemberKind(
        dto({ role_id: 2, email: 'a@b.be', password: 'x'.repeat(12) }),
      ),
    ).toBe('password');
  });

  it('a worker with email may also get a PIN', () => {
    expect(
      directMemberKind(
        dto({ email: 'a@b.be', password: 'x'.repeat(12), pin: '1234' }),
      ),
    ).toBe('password');
  });

  it('a worker with no email and a PIN = pin_only', () => {
    expect(directMemberKind(dto({ pin: '1234' }))).toBe('pin_only');
  });

  it.each([
    ['email without password', dto({ email: 'a@b.be' })],
    ['a non-worker without email', dto({ role_id: 2, pin: undefined })],
    [
      'a PIN on a non-worker',
      dto({
        role_id: 2,
        email: 'a@b.be',
        password: 'x'.repeat(12),
        pin: '1234',
      }),
    ],
    [
      'a password with no email',
      dto({ pin: '1234', password: 'x'.repeat(12) }),
    ],
    ['no email and no PIN', dto({})],
  ])('refuses %s', (_label, value) => {
    expect(() => directMemberKind(value)).toThrow(BadRequestException);
  });
});
