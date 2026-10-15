import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  BILLING_LOCALES,
  type BillingLocale,
} from '../helpers/card-payment.helper';

/** `POST /billing/checkout` and `POST /billing/portal` (step 21). */
export class CardPaymentDto {
  @ApiProperty({
    enum: BILLING_LOCALES,
    example: 'fr',
    description:
      'Language of the Stripe page and of the page Stripe returns to',
  })
  @IsIn(BILLING_LOCALES)
  locale: BillingLocale;
}
