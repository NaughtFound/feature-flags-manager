import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import configuration from './config/configuration';
import databaseConfig from './db/config';
import { Flag } from './db/entities/flag.entity';
import { FlagsModule } from './flags/flags.module';
import { UsersModule } from './users/users.module';
import { User } from './db/entities/user.entity';

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
          entities: [Flag, User],
          synchronize: true,
        };
      },
    }),
    FlagsModule,
    UsersModule,
  ],
})
export class AppModule {}
