// src/config/ormconfig.ts
import powerStation from '../models/PowerStation';
import loadDrop from '../models/LoadDrop';

const ormconfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'princeak',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'so-app-power',
    synchronize: true,
    logging: false,
    entities: [powerStation, loadDrop],
    migrations: [__dirname + '/../migrations/*.ts'],
    subscribers: [__dirname + '/../subscribers/*.ts'],
    cli: {
      entitiesDir: 'models',
      migrationsDir: 'src/migrations',
      subscribersDir: 'src/subscribers',
    },
    ssl: false
  };
  
  export default ormconfig;
  