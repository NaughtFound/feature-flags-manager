import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@app/db/entities/user.entity';
import { AuthModule } from '@app/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => AuthModule)],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
