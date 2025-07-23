import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '@app/db/entities/user.entity';
import { AuthModule } from '@app/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
