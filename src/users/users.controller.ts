import {
  Res,
  Body,
  Controller,
  Post,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from '@app/users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { apiResponse } from '@app/utils/response';
import { LocalAuthGuard } from '@app/auth/local-auth.guard';
import { User } from '@app/db/entities/user.entity';
import { AuthUser } from './users.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@AuthUser() user: User, @Res() res: Response) {
    const access_token = await this.usersService.verifyUser(user);

    return apiResponse(res, {
      statusCode: HttpStatus.ACCEPTED,
      data: {
        access_token,
      },
    });
  }

  @Post('signup')
  async signup(@Body() body: SignUpDto, @Res() res: Response) {
    const user = await this.usersService.createUser(
      body.username,
      body.password,
    );
    const access_token = await this.usersService.verifyUser(user);

    return apiResponse(res, {
      statusCode: HttpStatus.ACCEPTED,
      data: {
        access_token,
      },
    });
  }
}
