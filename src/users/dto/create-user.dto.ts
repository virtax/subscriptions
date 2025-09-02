import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @Expose()
  @IsOptional()
  id?: number;

  @Expose()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsEmail()
  email: string;
}
