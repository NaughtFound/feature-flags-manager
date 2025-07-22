import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import configuration from './config/configuration';
import databaseConfig from './db/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const data = databaseConfig(configService);

        return {
          type: 'mysql',
          host: data?.host ?? 'localhost',
          port: data?.port ?? 3306,
          username: data!.username,
          password: data!.password,
          database: data!.db_name,
          entities: [],
          synchronize: true,
        };
      },
    }),
  ],
})
export class AppModule {}
