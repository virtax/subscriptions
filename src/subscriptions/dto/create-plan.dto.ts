import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreatePlanDto {
  id?: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value as string))
  price_per_month: number;

  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => parseInt(value as string))
  qr_code_limit: number;
}
