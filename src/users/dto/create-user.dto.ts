import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @Expose()
  id?: number;

  @Expose()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsEmail()
  email: string;
}
