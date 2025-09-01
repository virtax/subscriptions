import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { apiUrl } from './common/test.constants';
import { createUser, deleteUser, getUser } from './common/user.test.methods';
import request from 'supertest';

let user: CreateUserDto;

describe('UsersController (e2e)', () => {
  it('create user', async () => {
    user = await createUser({
      name: 'John Smith',
      email: 'john.smith@mail.com',
    });
    expect(user.name).toBe('John Smith');
    expect(user.email).toBe('john.smith@mail.com');
  });

  it('get user', async () => {
    const checkUser = await getUser(user.id!);
    expect(checkUser.name).toBe('John Smith');
    expect(checkUser.email).toBe('john.smith@mail.com');
  });

  it('delete user', async () => {
    await deleteUser(user);
    await request(`${apiUrl}/users/${user.id}`).get('/').expect(404); // user not found
  });
});
