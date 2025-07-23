import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

  @Get('/:id')
  async getFlagInfo(@Param('id') id: number) {
    const flag = await this.flagsService.findFlag(id);

    return flag;
  }

  @Post('/')
  async createFlag(@Body() body: CreateFlagDto) {
    await this.flagsService.createFlag(
      body.label,
      body.isActive,
      body.dependencies,
    );
  }

  @Post('/:id/activate')
  async activateFlag(@Param('id') id: number) {
    await this.flagsService.activateFlag(id);
  }

  @Post('/:id/deactivate')
  async deactivateFlag(
    @Param('id') id: number,
    @Query('auto-disable') autoDisable: boolean = false,
  ) {
    await this.flagsService.deactivateFlag(id, autoDisable);
  }
}
