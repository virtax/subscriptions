import { UpdateUserDto } from './../../src/users/dto/update-user.dto';
import { apiUrl } from './test.constants';
import request from 'supertest';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';

export async function createUser(user: CreateUserDto): Promise<CreateUserDto> {
  const res = await request(`${apiUrl}/users`).post('/').send(user).expect(201);
  return res.body as CreateUserDto;
}

export async function deleteUser(user: UpdateUserDto) {
  await request(`${apiUrl}/users`).delete(`/${user.id}`).expect(200);
}

export async function getUser(userId: number): Promise<CreateUserDto> {
  const res = await request(`${apiUrl}/users/${userId}`).get('/').expect(200);
  return res.body as CreateUserDto;
}
