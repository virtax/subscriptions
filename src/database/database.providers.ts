import { appDataSource } from './database.datasource';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = appDataSource;
      return dataSource.initialize();
    },
  },
];
