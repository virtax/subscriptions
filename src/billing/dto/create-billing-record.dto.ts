import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class CreateBillingRecordDto {
  id?: number;

  @IsNotEmpty()
  subscription_id: number;

  @IsNotEmpty()
  createdAt: Date;

  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value as string))
  amount: number;

  @IsNotEmpty()
  description: string;
}
