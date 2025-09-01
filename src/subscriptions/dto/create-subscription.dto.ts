import { IsNotEmpty } from 'class-validator';

export class CreateSubscriptionDto {
  id?: number;

  @IsNotEmpty()
  user_id: number;

  @IsNotEmpty()
  plan_id: number;

  plan_start_date: Date;
  billing_cycle_start_date: Date;
  billing_cycle_end_date: Date;
  outstanding_credit: number;
  current_qrcode_usage: number;
}
