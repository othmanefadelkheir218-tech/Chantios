import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindInvoicesQueryDto } from '../dto/find-invoices-query.dto';
import { buildInvoiceFilter, toInvoiceEntity } from '../helpers/invoice.helper';
import { InvoiceRepository } from '../repositories/invoice.repository';

@Injectable()
export class FindInvoicesHandler {
  constructor(
    @InjectPinoLogger(FindInvoicesHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoiceRepository,
  ) {}

  async execute({
    page,
    limit,
    project_id,
    status,
    late,
  }: FindInvoicesQueryDto) {
    this.logger.debug(`Listing invoices (page ${page}, limit ${limit})`);
    const where = buildInvoiceFilter(project_id, status);

    if (late) {
      const filtered = await this.invoices.findManyLate(where);
      const skip = toSkip(page, limit);
      const data = filtered.slice(skip, skip + limit);
      return toPaginated(
        data.map((i) => toInvoiceEntity(i)),
        filtered.length,
        page,
        limit,
      );
    }

    const [data, total] = await this.invoices.findMany(
      where,
      toSkip(page, limit),
      limit,
    );
    return toPaginated(
      data.map((i) => toInvoiceEntity(i)),
      total,
      page,
      limit,
    );
  }
}
