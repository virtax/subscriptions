import { PartialType } from '@nestjs/mapped-types';
import { CreateBillingRecordDto } from './create-billing-record.dto';

export class UpdateBillingRecordDto extends PartialType(
  CreateBillingRecordDto,
) {}
