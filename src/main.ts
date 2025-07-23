import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import apiConfig from './api/config';
import { ThrowExceptionFilter } from './utils/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ stopAtFirstError: true }));
  app.useGlobalFilters(new ThrowExceptionFilter());

  const configService = app.get<ConfigService>(ConfigService);
  const data = apiConfig(configService);

  app.enableCors({
    origin: data?.cors_origin,
    credentials: true,
  });

  const port = data?.port ?? 3000;
  const host = data?.host ?? 'localhost';

  await app.listen(port, host);
}
bootstrap();
