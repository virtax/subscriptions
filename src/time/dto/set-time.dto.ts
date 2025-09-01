import { IsISO8601, IsOptional } from 'class-validator';

export class SetTimeDto {
  @IsOptional()
  @IsISO8601()
  time?: string;
}
