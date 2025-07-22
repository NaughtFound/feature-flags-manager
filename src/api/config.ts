import { ConfigService } from '@nestjs/config';

interface APIConfig {
  port: string;
  host: string;
  cors_origin: string;
}

export default (configService: ConfigService) =>
  configService.get<APIConfig>('api');
