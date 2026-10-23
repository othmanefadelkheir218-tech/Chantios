import { applyDecorators } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiIntParam } from '../../common/swagger/api-paginated.decorator';
import { VatRateEntity } from '../entities/vat-rate.entity';

export const ApiFindVatRates = () =>
  applyDecorators(
    ApiOperation({
      summary: 'The TVA table of the subscription (admin staff)',
      description:
        'One row per country, active first. This is the TVA a company pays ChantierOS, not the TVA on its own quotes.',
    }),
    ApiOkResponse({ type: [VatRateEntity] }),
  );

export const ApiCreateVatRate = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Add a country to the TVA table (super_admin / billing)',
      description:
        'Creates the Stripe TaxRate first (and the 0 % reverse-charge one for an EU country). Stripe fails → nothing saved.',
    }),
    ApiCreatedResponse({ type: VatRateEntity }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
    ApiConflictResponse({ description: 'The country already exists' }),
    ApiBadGatewayResponse({ description: 'Stripe failed' }),
  );

export const ApiUpdateVatRate = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Change a rate, the EU flag, or close / reopen a country',
      description:
        'A new rate applies from the next invoice: new Stripe TaxRate, old one archived, the card subscriptions of the country re-pointed in the background. Closing is refused while a company of the country pays by card.',
    }),
    ApiIntParam('id', 'TVA rate id'),
    ApiOkResponse({ type: VatRateEntity }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
    ApiNotFoundResponse({ description: 'TVA rate not found' }),
    ApiConflictResponse({
      description: 'Companies of this country pay by card',
    }),
    ApiBadGatewayResponse({ description: 'Stripe failed' }),
  );

export const ApiFindVatCountries = () =>
  applyDecorators(
    ApiOperation({
      summary: 'The countries a company can choose (public)',
      description:
        'Active countries of the TVA table only — for the signup, profile and create-company selects.',
    }),
    ApiOkResponse({ type: [String], example: ['BE', 'DE', 'ES', 'FR', 'NL'] }),
  );
