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
    ApiOperation({ summary: 'My own user + role + resolved permissions' }),
    ApiOkResponse({ description: 'User, role and permissions' }),
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
