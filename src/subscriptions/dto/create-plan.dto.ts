import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePlanDto {
  @IsOptional()
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
