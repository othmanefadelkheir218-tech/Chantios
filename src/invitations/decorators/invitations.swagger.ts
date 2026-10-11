import { UserEntity } from '../../users/entities/user.entity';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiIntParam,
  ApiPaginatedResponse,
} from '../../common/swagger/api-paginated.decorator';
import { InvitationEntity } from '../entities/invitation.entity';

const idParam = () => ApiIntParam('id', 'Invitation id');

export const ApiCreateInvitation = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Invite an employee (admin)',
      description:
        'Refuses an email already used anywhere. Re-inviting the same email at this company replaces the old row.',
    }),
    ApiCreatedResponse({
      description: 'Invitation sent',
      type: InvitationEntity,
    }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
    ApiConflictResponse({
      description: 'Email already used or invited elsewhere',
    }),
  );

export const ApiCreateDirectMember = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Add a member without the invitation email (admin)',
      description:
        'Email + temporary password (any role; the user must choose a new password after login), or a worker with no email: PIN only, the response carries an 8-digit login_code for the phone login. No email is sent.',
    }),
    ApiCreatedResponse({ description: 'Member created', type: UserEntity }),
    ApiBadRequestResponse({
      description: 'Invalid data, or a shape that is not allowed',
    }),
    ApiConflictResponse({
      description: 'Email already used or invited elsewhere',
    }),
  );

export const ApiFindInvitations = () =>
  applyDecorators(
    ApiOperation({ summary: 'List open invitations (admin)' }),
    ApiPaginatedResponse(
      InvitationEntity,
      'Paginated list of open invitations',
    ),
  );

export const ApiResendInvitation = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Resend an invitation (admin)',
      description: 'Issues a fresh token on the same row.',
    }),
    idParam(),
    ApiOkResponse({ description: 'Invitation resent', type: InvitationEntity }),
    ApiBadRequestResponse({ description: 'Already accepted' }),
    ApiNotFoundResponse({ description: 'Invitation not found' }),
  );

export const ApiRevokeInvitation = () =>
  applyDecorators(
    ApiOperation({ summary: 'Revoke an invitation (admin)' }),
    idParam(),
    ApiOkResponse({ description: 'Invitation revoked' }),
    ApiBadRequestResponse({ description: 'Already accepted' }),
    ApiNotFoundResponse({ description: 'Invitation not found' }),
  );

export const ApiVerifyInvitation = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verify an invitation token, for the accept form',
    }),
    ApiOkResponse({
      description: 'Name and company, for display',
      schema: {
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          company: { type: 'string' },
        },
      },
    }),
    ApiBadRequestResponse({ description: 'Invalid, used or expired token' }),
  );

export const ApiAcceptInvitation = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Accept an invitation — sets the password, creates the user',
    }),
    ApiOkResponse({
      description: 'Account created',
      schema: {
        properties: {
          accepted: { type: 'boolean' },
          user_id: { type: 'number' },
        },
      },
    }),
    ApiBadRequestResponse({ description: 'Invalid, used or expired token' }),
  );
