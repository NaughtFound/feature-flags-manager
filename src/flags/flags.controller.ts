import { Body, Controller, Get, Post } from '@nestjs/common';
import { FlagsService } from './flags.service';
import { CreateFlagDto } from './dto/create.dto';

@Controller('flags')
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) {}

  @Get('/')
  async getFlags() {
    const flags = await this.flagsService.listFlags();

    return flags;
  }

  @Post('/')
  async createFlag(@Body() body: CreateFlagDto) {
    await this.flagsService.createFlag(
      body.label,
      body.isActive,
      body.dependencies,
    );
  }
}
