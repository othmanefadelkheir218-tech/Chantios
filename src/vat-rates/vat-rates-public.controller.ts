import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { ApiFindVatCountries } from './decorators/vat-rates.swagger';
import { VatRatesService } from './vat-rates.service';

/** No login: feeds the country selects (signup, profile, create company). Never the Stripe ids. */
@ApiTags('TVA rates (public)')
@Public()
@UseInterceptors(SnakeCaseInterceptor)
@Controller('vat-rates')
export class VatRatesPublicController {
  constructor(private readonly vatRatesService: VatRatesService) {}

  @Get('countries')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiFindVatCountries()
  countries() {
    return this.vatRatesService.activeCountries();
  }
}
