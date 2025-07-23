import { ConfigService } from '@nestjs/config';

interface AuthConfig {
  jwt_secret: string;
  jwt_expires_in: string;
}

export default (configService: ConfigService) =>
  configService.get<AuthConfig>('auth');
