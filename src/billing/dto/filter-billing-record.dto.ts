import { IsOptional } from 'class-validator';

export class FilterBillingRecordDto {
  @IsOptional()
  id: number;

  @IsOptional()
  subscription_id: number;
}
