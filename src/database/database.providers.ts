import { DataSource } from 'typeorm';

const url =
  process.env['NODE_ENV'] == 'test'
    ? process.env['TEST_DATABASE_URL']
    : process.env['DATABASE_URL'];

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        port: 5432,
        url,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: ['query', 'error'], // Enable SQL logging
      });

      return dataSource.initialize();
    },
  },
];
