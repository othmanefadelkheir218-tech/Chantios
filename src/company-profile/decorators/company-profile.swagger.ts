import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { CompanyProfileEntity } from '../entities/company-profile.entity';

export const ApiGetCompanyProfile = () =>
  applyDecorators(
    ApiOperation({
      summary: 'My company profile + logo URL',
      description:
        'Every logged-in user of the company. The tenant comes from the session.',
    }),
    ApiOkResponse({ type: CompanyProfileEntity }),
  );

export const ApiUpdateCompanyProfile = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Edit my company profile',
      description:
        'settings module, can_edit (admin by default). email and currency are fixed by the backend and refused here. Writes audit_logs with the old and new values.',
    }),
    ApiOkResponse({ type: CompanyProfileEntity }),
    ApiBadRequestResponse({
      description:
        'Validation failed (bad IBAN/BIC, unknown field such as email or currency)',
    }),
    ApiForbiddenResponse({ description: 'No edit access to settings' }),
  );
