import { applyDecorators } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiIntParam,
  ApiPaginatedResponse,
} from '../../common/swagger/api-paginated.decorator';
import {
  ContactDetailsEntity,
  ContactEntity,
} from '../entities/contact.entity';

export const ApiFindContacts = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List the employees as cards (contacts:view)',
      description:
        'Every user of the company, inactive included (is_active false), active first then by name. `search` matches name, email, phone and role. Never sends hourly_rate.',
    }),
    ApiPaginatedResponse(ContactEntity, 'Paginated list of contacts'),
  );

export const ApiFindContact = () =>
  applyDecorators(
    ApiOperation({
      summary: 'One employee and their open projects (contacts:view)',
      description:
        'Projects: prospect / in_progress, where the employee is project manager or a task assignee. Name and status only. Never sends hourly_rate.',
    }),
    ApiIntParam('id', 'User id'),
    ApiOkResponse({ description: 'The contact', type: ContactDetailsEntity }),
    ApiNotFoundResponse({ description: 'Contact not found' }),
  );
