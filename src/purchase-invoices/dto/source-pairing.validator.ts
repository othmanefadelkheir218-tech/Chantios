import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { getSourcePairingError } from '../helpers/purchase-invoice.helper';

interface SourceFields {
  type?: 'subcontractor' | 'supplier';
  subcontractor_contract_id?: number | null;
  supplier_id?: number | null;
  project_id?: number | null;
}

/**
 * Class-level rule hung on `type`: exactly one source, and a subcontractor
 * bill needs a project. The rule itself lives in `getSourcePairingError`
 * (helper) — the DB check `chk_purchase_one_source` backs it up.
 */
export function IsValidBillSource(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidBillSource',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          return sourceError(args.object) === null;
        },
        defaultMessage(args: ValidationArguments) {
          return sourceError(args.object) ?? 'invalid bill source';
        },
      },
    });
  };
}

function sourceError(o: SourceFields): string | null {
  return getSourcePairingError(
    o.type,
    o.subcontractor_contract_id,
    o.supplier_id,
    o.project_id,
  );
}
