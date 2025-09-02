import { IsOptional } from 'class-validator';

export class FilterSubscriptionDto {
  @IsOptional()
  id: number;
}
