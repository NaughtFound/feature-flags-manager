import { Injectable } from '@nestjs/common';
import { AuthService } from '@app/auth/auth.service';
import { User, UserRepo } from '@app/db/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: UserRepo,
    private readonly authService: AuthService,
  ) {}

  async findByUsername(username: string): Promise<User | undefined> {
    const user = await this.userRepo.findOneBy({ username });
    if (user instanceof User) return user;

    return undefined;
  }

  async createUser(username: string, password: string) {
    password = await this.authService.hashPassword(password ?? '');

    const user = await this.userRepo.save({
      username,
      password,
    });

    return user;
  }

  async verifyUser(user: User): Promise<string> {
    return this.authService.login(user);
  }
}
