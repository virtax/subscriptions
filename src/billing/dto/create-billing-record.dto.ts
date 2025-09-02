import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBillingRecordDto {
  @IsOptional()
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
