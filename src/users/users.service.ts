import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_REPOSITORY')
    private usersRepository: Repository<User>,
  ) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async dtoToEntity(userDto: UpdateUserDto): Promise<User> {
    const user: User = this.usersRepository.create(userDto);
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);
    const savedUser = await this.usersRepository.save(user);

    return plainToClass(CreateUserDto, savedUser, {
      excludeExtraneousValues: true,
    });
  }

  async findAll() {
    const users = await this.usersRepository.find();
    return users.map((user) =>
      plainToClass(UpdateUserDto, user, { excludeExtraneousValues: true }),
    );
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return plainToClass(UpdateUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.preload({
      id: id,
      ...updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    const savedUser = await this.usersRepository.save(user);

    return plainToClass(UpdateUserDto, savedUser, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: number) {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }
}
