import { ConfigService } from '@nestjs/config';

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  db_name: string;
}

export default (configService: ConfigService) =>
  configService.get<DatabaseConfig>('database');
