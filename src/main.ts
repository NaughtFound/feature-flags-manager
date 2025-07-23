import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import apiConfig from './api/config';
import { ThrowExceptionFilter } from './utils/exception.filter';
import { AuditService } from './audit/audit.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService>(ConfigService);
  const auditService = app.get<AuditService>(AuditService);
  const data = apiConfig(configService);

  app.useGlobalPipes(new ValidationPipe({ stopAtFirstError: true }));
  app.useGlobalFilters(new ThrowExceptionFilter(auditService));

  app.enableCors({
    origin: data?.cors_origin,
    credentials: true,
  });

  const port = data?.port ?? 3000;
  const host = data?.host ?? 'localhost';

  await app.listen(port, host);
}
bootstrap();
