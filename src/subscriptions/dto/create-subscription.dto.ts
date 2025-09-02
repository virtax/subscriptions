import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @IsOptional()
  id?: number;

  @IsNotEmpty()
  user_id: number;

  @IsNotEmpty()
  plan_id: number;

  @IsOptional()
  plan_start_date: Date;

  @IsOptional()
  billing_cycle_start_date: Date;

  @IsOptional()
  billing_cycle_end_date: Date;

  @IsOptional()
  outstanding_credit: number;

  @IsOptional()
  current_qrcode_usage: number;
}
