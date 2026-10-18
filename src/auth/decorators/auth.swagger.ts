import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiIntParam } from '../../common/swagger/api-paginated.decorator';
import { AdminUserEntity } from '../../admin-users/entities/admin-user.entity';
import { UserEntity } from '../../users/entities/user.entity';

export const ApiRegister = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register a new company',
      description:
        'One transaction: tenants + users (role admin) + tenant_subscriptions (trialing, 14 days). Fails with no writes if no default plan exists.',
    }),
    ApiCreatedResponse({ description: 'Company registered' }),
    ApiBadRequestResponse({
      description: 'Invalid data, or no default plan configured',
    }),
    ApiConflictResponse({ description: 'Email already used' }),
  );

export const ApiLogin = () =>
  applyDecorators(
    ApiOperation({ summary: 'Log in — email + password' }),
    ApiOkResponse({ description: '2 httpOnly cookies set', type: UserEntity }),
    ApiUnauthorizedResponse({ description: 'Invalid credentials' }),
  );

export const ApiRefresh = () =>
  applyDecorators(
    ApiOperation({ summary: 'Rotate the session from the refresh cookie' }),
    ApiOkResponse({ description: 'New cookies set', type: UserEntity }),
    ApiUnauthorizedResponse({
      description: 'Missing, invalid or revoked refresh token',
    }),
  );

export const ApiLogout = () =>
  applyDecorators(
    ApiOperation({ summary: 'Log out this device' }),
    ApiOkResponse({ description: 'Cookies cleared, session revoked' }),
  );

export const ApiForgotPassword = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Request a password reset code',
      description: 'Same response whether the email exists or not.',
    }),
    ApiOkResponse({ description: 'Always returns sent: true' }),
  );

export const ApiCheckResetCode = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Check the emailed reset code (step 1 of the reset form)',
      description:
        'The code is NOT used: send it again with the new password. A wrong code counts as one try.',
    }),
    ApiOkResponse({ description: 'valid: true' }),
    ApiBadRequestResponse({ description: 'Invalid or expired code' }),
  );

export const ApiResetPassword = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Reset the password with the emailed code',
      description: 'Revokes every session.',
    }),
    ApiOkResponse({ description: 'Password reset' }),
    ApiBadRequestResponse({ description: 'Invalid or expired code' }),
  );

export const ApiChangePassword = () =>
  applyDecorators(
    ApiOperation({ summary: 'Change my own password' }),
    ApiOkResponse({ description: 'Password changed' }),
    ApiBadRequestResponse({ description: 'The current password is wrong' }),
  );

export const ApiVerifyEmail = () =>
  applyDecorators(
    ApiOperation({ summary: 'Verify my own email with the 24h code' }),
    ApiOkResponse({ description: 'Email verified' }),
    ApiBadRequestResponse({ description: 'Invalid or expired code' }),
  );

export const ApiMe = () =>
  applyDecorators(
    ApiOperation({
      summary: 'My own user + role + resolved permissions',
      description:
        '`impersonation` is null for a normal login, or { admin_user_id, admin_name, expires_at } while a platform admin acts as this user.',
    }),
    ApiOkResponse({
      description: 'User, role, permissions and impersonation',
    }),
  );

export const ApiListSessions = () =>
  applyDecorators(
    ApiOperation({ summary: 'My live sessions (refresh_tokens rows)' }),
    ApiOkResponse({ description: 'List of live sessions' }),
  );

export const ApiRevokeSession = () =>
  applyDecorators(
    ApiOperation({ summary: 'Kill one of my sessions (another device)' }),
    ApiIntParam('id', 'Session (refresh_tokens) id'),
    ApiOkResponse({ description: 'Session revoked' }),
  );

export const ApiRevokeAllSessions = () =>
  applyDecorators(
    ApiOperation({ summary: 'Kill every one of my sessions' }),
    ApiOkResponse({ description: 'Count of sessions revoked' }),
  );

export const ApiMobileLogin = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Mobile login — email + PIN (worker role only)',
      description: 'Locks after 5 wrong PINs.',
    }),
    ApiOkResponse({ description: '2 httpOnly cookies set', type: UserEntity }),
    ApiUnauthorizedResponse({ description: 'Invalid credentials' }),
    ApiForbiddenResponse({ description: 'Locked after too many wrong PINs' }),
  );

export const ApiAdminLogin = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Platform admin login — password, then a 2FA challenge',
    }),
    ApiOkResponse({
      description:
        'challenge_token, or logged in directly if 2FA is not set up',
    }),
    ApiUnauthorizedResponse({ description: 'Invalid credentials' }),
  );

export const ApiVerify2fa = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Complete the admin 2FA challenge — TOTP, 5 min, 3 tries',
    }),
    ApiOkResponse({ description: '2 httpOnly admin cookies set' }),
    ApiUnauthorizedResponse({
      description: 'Invalid code or expired challenge',
    }),
  );

export const ApiAdminLogout = () =>
  applyDecorators(
    ApiOperation({ summary: 'Platform admin logout' }),
    ApiOkResponse({ description: 'Cookies cleared, session revoked' }),
  );

export const ApiAdminRefresh = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Renew the platform admin session',
      description:
        'Reads the admin_refresh_token cookie (no body). Rotation: old session revoked, new cookies set. A replayed revoked token revokes every session of that admin.',
    }),
    ApiOkResponse({ description: '2 new httpOnly admin cookies set' }),
    ApiUnauthorizedResponse({
      description:
        'No, invalid, expired or revoked refresh token, or inactive admin',
    }),
  );

export const ApiAdminMe = () =>
  applyDecorators(
    ApiOperation({
      summary: 'The logged-in platform admin',
      description: 'Never returns password_hash or totp_secret.',
    }),
    ApiOkResponse({ type: AdminUserEntity }),
    ApiUnauthorizedResponse({
      description: 'Not logged in, or inactive admin',
    }),
  );

export const ApiAdminCreateTenant = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a company + its trial + an invitation for its boss',
      description:
        'One transaction: tenants + tenant_subscriptions (default plan, trialing, 14 days) + user_invitations (role admin, invited_by_admin_user_id). The boss gets the normal invitation email and sets their own password.',
    }),
    ApiCreatedResponse({
      description: 'The tenant, with owner_invitation',
    }),
    ApiBadRequestResponse({
      description: 'Validation error, or no default plan configured',
    }),
    ApiConflictResponse({
      description:
        'Company email already used, or owner_email already a user / has an open invitation — nothing is created',
    }),
  );
