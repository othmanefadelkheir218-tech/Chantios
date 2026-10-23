import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiIntParam } from '../../common/swagger/api-paginated.decorator';

const READ_RULE =
  'Company inbox → every user with email:view. Gmail inbox → its owner only (the admin gets 404). Rules: doc/notes/client-email.md.';
const notFound = () =>
  ApiNotFoundResponse({
    description: 'Unknown, another company, or a Gmail chat of someone else',
  });
const chatId = () => ApiIntParam('id', 'Client chat (conversation) id');
const topicId = () => ApiIntParam('topicId', 'Email topic id');

export const ApiFindClientChats = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Client chats I may read (email:view)',
      description: `Newest activity first, unread count, email + portal marks. \`unknown=true\` = unknown contacts only. ${READ_RULE}`,
    }),
    ApiOkResponse({ description: '{ data, total, page, limit }' }),
    ApiForbiddenResponse({ description: 'No email permission' }),
  );

export const ApiFindClientChat = () =>
  applyDecorators(
    ApiOperation({
      summary: 'One client chat with its topics (email:view)',
      description: `Topics = the first 20 email topics, newest activity first (\`topics_total\` = all of them; next pages: GET /client-chats/:id/topics) + the client's portal chats (channel "portal", read through /api/conversations/:id). \`topic_id\` = also that topic when it is older. ${READ_RULE}`,
    }),
    chatId(),
    ApiOkResponse({ description: 'The chat' }),
    notFound(),
  );

export const ApiFindChatTopics = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Email topics of one client chat, paged (email:view)',
      description: `Newest activity first, same shape as the email topics of GET /client-chats/:id (page 1 = its first 20). "search" keeps the topics whose subject holds that text (any case). Portal chats are not here. ${READ_RULE}`,
    }),
    chatId(),
    ApiOkResponse({ description: '{ data, total, page, limit }' }),
    notFound(),
  );

export const ApiFindTopicMessages = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Messages of one email topic (email:view)',
      description:
        'Newest first. `content` = the clean text; `email` = from, to, subject, original HTML, skipped files.',
    }),
    chatId(),
    topicId(),
    ApiOkResponse({ description: '{ data, total, page, limit }' }),
    notFound(),
  );

export const ApiSendNewEmail = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Send a new email = a new topic (email:create)',
      description:
        "From `inbox_id` (readable + active) or the company inbox. A client address → that client's chat, else a contact chat. `project_id` must be a project of that client. Gmail: the subject ends with the topic code.",
    }),
    ApiCreatedResponse({ description: '{ conversation_id, topic, message }' }),
    ApiBadRequestResponse({
      description: 'Validation, or project of another client',
    }),
    ApiConflictResponse({
      description: 'Company address not set, or the Gmail is disconnected',
    }),
    notFound(),
  );

export const ApiUploadEmailAttachment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Upload a file for an email (email:create)',
      description:
        'PDF, images, Office, ZIP, TXT, CSV, max 25 MB; programs refused. Then name its id in `media_ids`.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: { file: { type: 'string', format: 'binary' } },
      },
    }),
    ApiCreatedResponse({ description: 'The pending file (media)' }),
    ApiBadRequestResponse({ description: 'Type refused, or too large' }),
  );

export const ApiReplyInTopic = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Reply in a topic (email:create)',
      description:
        "Same inbox as the topic, to the address of the client's last email in it. Never sent from another address.",
    }),
    topicId(),
    ApiCreatedResponse({ description: 'The sent message' }),
    ApiConflictResponse({ description: 'The Gmail is disconnected' }),
    notFound(),
  );

export const ApiSetTopicProject = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Set the project tag of a topic',
      description:
        "Shared inbox: email:edit + projects:edit. Gmail: the owner only. The project must be one of the chat's client (400 otherwise). Confirms a suggested tag.",
    }),
    topicId(),
    ApiOkResponse({ description: 'The topic' }),
    ApiBadRequestResponse({ description: 'Project of another client' }),
    ApiForbiddenResponse({ description: 'No edit right' }),
    notFound(),
  );

export const ApiMoveMessage = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Move a received email to another topic of the same chat',
      description:
        'Shared inbox: email:edit. Gmail: the owner. 400 for an email we sent or a topic of another chat.',
    }),
    ApiIntParam('messageId', 'Message id'),
    ApiOkResponse({ description: 'The moved message' }),
    ApiBadRequestResponse({ description: 'Sent email, or another chat' }),
    notFound(),
  );

export const ApiMarkClientChatRead = () =>
  applyDecorators(
    ApiOperation({ summary: 'Mark every message of the chat read for me' }),
    chatId(),
    ApiOkResponse({ description: '{ conversation_id, marked, unread }' }),
    notFound(),
  );

export const ApiAddClientAddress = () =>
  applyDecorators(
    ApiOperation({
      summary: '"Add this address" to the chat\'s client (clients:edit)',
    }),
    chatId(),
    ApiCreatedResponse({ description: 'The new address' }),
    ApiConflictResponse({ description: 'Already an address of a client' }),
    ApiForbiddenResponse({ description: 'No clients edit right' }),
    notFound(),
  );

export const ApiDeleteClientChat = () =>
  applyDecorators(
    ApiOperation({
      summary: 'GDPR: delete a client chat (settings:delete)',
      description:
        'Deletes the chat, its topics, messages, email details, reads and files. One audit row gdpr_delete. The only delete of messages in the app.',
    }),
    chatId(),
    ApiOkResponse({ description: 'What was deleted' }),
    ApiForbiddenResponse({ description: 'No settings delete right' }),
    notFound(),
  );

export const ApiFindProjectTopics = () =>
  applyDecorators(
    ApiOperation({
      summary:
        'Email topics tagged with a project (email:view + projects:view)',
      description: READ_RULE,
    }),
    ApiIntParam('id', 'Project id'),
    ApiOkResponse({ description: '{ data, total, page, limit }' }),
    ApiForbiddenResponse({ description: 'No projects view' }),
    ApiNotFoundResponse({ description: 'Unknown project' }),
  );

export const ApiCreateClientFromChat = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Unknown contact → new client (clients:create)',
      description:
        'Body = the normal client form (the frontend fills in the name and email from the email). The chat moves to the client.',
    }),
    chatId(),
    ApiCreatedResponse({ description: '{ conversation_id, client }' }),
    ApiBadRequestResponse({
      description: 'Already a client chat, or invalid form',
    }),
    ApiConflictResponse({ description: 'A client with this email exists' }),
    notFound(),
  );
