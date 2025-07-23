import * as argon2 from 'argon2';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@app/db/entities/user.entity';
import { UsersService } from '@app/users/users.service';

export class AuthPayload {
  username: string;

  constructor() {
    this.username = '';
  }

  public toObject(): object {
    return {
      ...this,
    };
  }

  public static fromObject(obj: object): AuthPayload {
    const payload = new AuthPayload();

    Object.keys(payload).forEach((key) => {
      if (key in obj && typeof obj[key] !== 'undefined') {
        payload[key] = obj[key];
      }
    });

    return payload;
  }
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);

    if (user && (await this.verifyPassword(user.password, password))) {
      return user;
    }

    return null;
  }

  async verifyPassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return argon2.verify(hashedPassword, plainPassword);
  }

  async hashPassword(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword);
  }

  async login(user: User): Promise<string> {
    const payload = new AuthPayload();
    payload.username = user.username;

    const access_token = this.jwtService.sign(payload.toObject());

    return access_token;
  }
}
