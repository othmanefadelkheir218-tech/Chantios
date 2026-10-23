import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionVatRate } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the vat-rates module talks to the database (subscription_vat_rates). */
@Injectable()
export class VatRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Active rows first, then by country. */
  findAll(): Promise<SubscriptionVatRate[]> {
    return this.prisma.subscriptionVatRate.findMany({
      orderBy: [{ isActive: 'desc' }, { countryCode: 'asc' }],
    });
  }

  findById(id: number): Promise<SubscriptionVatRate | null> {
    return this.prisma.subscriptionVatRate.findUnique({ where: { id } });
  }

  findByCountry(countryCode: string): Promise<SubscriptionVatRate | null> {
    return this.prisma.subscriptionVatRate.findUnique({
      where: { countryCode },
    });
  }

  /** The countries a company may choose (signup, profile, super-admin create). */
  async findActiveCountryCodes(): Promise<string[]> {
    const rows = await this.prisma.subscriptionVatRate.findMany({
      where: { isActive: true },
      select: { countryCode: true },
      orderBy: { countryCode: 'asc' },
    });
    return rows.map((r) => r.countryCode);
  }

  create(
    data: Prisma.SubscriptionVatRateCreateInput,
  ): Promise<SubscriptionVatRate> {
    return this.prisma.subscriptionVatRate.create({ data });
  }

  update(
    id: number,
    data: Prisma.SubscriptionVatRateUpdateInput,
  ): Promise<SubscriptionVatRate> {
    return this.prisma.subscriptionVatRate.update({ where: { id }, data });
  }
}
