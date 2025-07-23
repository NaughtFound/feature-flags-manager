import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@app/users/users.service';
import { AuthPayload } from '@app/auth/auth.service';
import authConfig from './config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const data = authConfig(configService);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: data?.jwt_secret,
    });
  }

  async validate(payload: object) {
    const authPayload = AuthPayload.fromObject(payload);

    return this.usersService.findByUsername(authPayload.username);
  }
}
