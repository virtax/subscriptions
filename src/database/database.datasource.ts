import { DataSource } from 'typeorm';

const url =
  process.env['NODE_ENV'] == 'test'
    ? process.env['TEST_DATABASE_URL']
    : process.env['DATABASE_URL'];

export const appDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  url,
  synchronize: false,
  migrationsRun: true,
  logging: false,
  entities: ['../**/*.entity.js'],
  subscribers: [],
  migrations: ['./src/database/migrations/*.ts'],
});
