import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FlagsService } from './flags.service';
import { CreateFlagDto } from './dto/create.dto';
import { apiResponse } from '@app/utils/response';

@Controller('flags')
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) {}

  @Get('/')
  async getFlags(@Res() res: Response) {
    const flags = await this.flagsService.listFlags();

    return apiResponse(res, {
      data: flags,
    });
  }

  @Get('/:id')
  async getFlagInfo(@Param('id') id: number, @Res() res: Response) {
    const flag = await this.flagsService.findFlag(id);

    return apiResponse(res, {
      data: flag,
    });
  }

  @Post('/')
  async createFlag(@Body() body: CreateFlagDto, @Res() res: Response) {
    await this.flagsService.createFlag(
      body.label,
      body.isActive,
      body.dependencies,
    );

    return apiResponse(res, {
      statusCode: HttpStatus.CREATED,
      message: 'Flag created successfully',
    });
  }

  @Post('/:id/activate')
  async activateFlag(@Param('id') id: number, @Res() res: Response) {
    await this.flagsService.activateFlag(id);

    return apiResponse(res, {
      message: 'Flag activated successfully',
    });
  }

  @Post('/:id/deactivate')
  async deactivateFlag(
    @Param('id') id: number,
    @Query('auto-disable') autoDisable: boolean = false,
    @Res() res: Response,
  ) {
    await this.flagsService.deactivateFlag(id, autoDisable);

    return apiResponse(res, {
      message: 'Flag deactivated successfully',
    });
  }

  @Post('/:id/update')
  async updateDependencies(
    @Param('id') id: number,
    @Body('dependencies') dependencies: number[],
    @Res() res: Response,
  ) {
    await this.flagsService.updateDependencies(id, dependencies);

    return apiResponse(res, {
      message: 'Dependencies updated successfully',
    });
  }
}
