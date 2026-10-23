import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiFoundResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiIntParam } from '../../common/swagger/api-paginated.decorator';

const RULES = 'Rules: doc/notes/client-email.md.';

export const ApiFindInboxes = () =>
  applyDecorators(
    ApiOperation({
      summary: 'The company inbox + my Gmail inboxes (email:view)',
      description: `\`company\`: the company address and its old addresses (null until the admin picks one). \`mine\`: my Gmail inboxes with the forward address and Gmail's confirm link. \`others\`: every other Gmail inbox of the company, status only — only for a user with settings:view (else null). ${RULES}`,
    }),
    ApiOkResponse({ description: '{ company, mine, others }' }),
    ApiForbiddenResponse({ description: 'No email permission' }),
  );

export const ApiSetCompanyAddress = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Pick the company address (settings:edit)',
      description: `Creates the company inbox on the first call. The new name becomes primary; the old one keeps working. ${RULES}`,
    }),
    ApiOkResponse({ description: 'The company inbox' }),
    ApiBadRequestResponse({
      description: 'Wrong format, or starts with reply-',
    }),
    ApiConflictResponse({ description: 'The address is taken' }),
    ApiForbiddenResponse({ description: 'No settings edit permission' }),
  );

export const ApiStartGmailConnect = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Google consent link to connect MY Gmail (email_gmail:create — admin only by default)',
      description:
        'Open `url` in the browser. Scope gmail.send only. The signed state is valid 10 minutes. Never blocked by the plan (billed at renewal).',
    }),
    ApiOkResponse({ description: '{ url }' }),
    ApiForbiddenResponse({
      description: 'No email permission, or impersonating',
    }),
  );

export const ApiGmailCallback = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Google OAuth callback (public)',
      description:
        'Redirects to APP_URL/<locale>/settings/email?gmail=connected, or ?gmail=error&reason=access_denied|invalid_state|send_permission_missing|user_inactive|google_error.',
    }),
    ApiQuery({ name: 'code', required: false }),
    ApiQuery({ name: 'state', required: false }),
    ApiQuery({ name: 'error', required: false }),
    ApiFoundResponse({ description: 'Redirect to the settings page' }),
  );

export const ApiDisconnectInbox = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Remove a Gmail inbox (owner, or settings:edit)',
      description: `Revokes the access at Google, wipes the token, status removed. The chats stay, read-only; removing never gives read access. ${RULES}`,
    }),
    ApiIntParam('id', 'Inbox id'),
    ApiOkResponse({ description: '{ id, status: "removed" }' }),
    ApiBadRequestResponse({ description: 'The company inbox' }),
    ApiForbiddenResponse({ description: 'Not the owner, no settings edit' }),
    ApiNotFoundResponse({ description: 'Unknown or already removed' }),
  );
