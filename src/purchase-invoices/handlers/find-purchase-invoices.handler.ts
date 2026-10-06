import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindPurchaseInvoicesQueryDto } from '../dto/find-purchase-invoices-query.dto';
import {
  buildPurchaseInvoiceFilter,
  toPurchaseInvoiceEntity,
} from '../helpers/purchase-invoice.helper';
import { PurchaseInvoiceRepository } from '../repositories/purchase-invoice.repository';

/** `GET /api/purchase-invoices` — `?type=&status=&project_id=&cost_type_id=`. */
@Injectable()
export class FindPurchaseInvoicesHandler {
  constructor(
    @InjectPinoLogger(FindPurchaseInvoicesHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: PurchaseInvoiceRepository,
  ) {}

  async execute(query: FindPurchaseInvoicesQueryDto) {
    const { page, limit } = query;
    this.logger.debug(
      `Listing purchase invoices (page ${page}, limit ${limit})`,
    );

    const [data, total] = await this.invoices.findMany(
      buildPurchaseInvoiceFilter({
        type: query.type,
        status: query.status,
        projectId: query.project_id,
        costTypeId: query.cost_type_id,
      }),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toPurchaseInvoiceEntity), total, page, limit);
  }
}
