import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { FlagsService } from './flags.service';
import { CreateFlagDto } from './dto/create.dto';
import { apiResponse } from '@app/utils/response';
import { JwtAuthGuard } from '@app/auth/jwt-auth.guard';
import { AuditService } from '@app/audit/audit.service';
import { User } from '@app/db/entities/user.entity';
import { AuthUser } from '@app/users/users.decorator';

@Controller('flags')
export class FlagsController {
  constructor(
    private readonly flagsService: FlagsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('/')
  async getFlags(@Res() res: Response) {
    const flags = await this.flagsService.listFlags();

    await this.auditService.log({
      operation: 'Get Flags',
      entityType: 'Flag',
      metadata: flags,
      reason: 'getting list of flags based on topological order',
    });

    return apiResponse(res, {
      data: flags,
    });
  }

  @Get('/:id')
  async getFlagInfo(
    @AuthUser() user: User,
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    const flag = await this.flagsService.findFlag(id);

    await this.auditService.log({
      userId: user.id,
      operation: 'Get Flag',
      entityType: 'Flag',
      entityId: id,
      metadata: flag,
      reason: 'getting flag information based on id',
    });

    return apiResponse(res, {
      data: flag,
    });
  }

  @Post('/')
  @UseGuards(JwtAuthGuard)
  async createFlag(
    @AuthUser() user: User,
    @Body() body: CreateFlagDto,
    @Res() res: Response,
  ) {
    const flag = await this.flagsService.createFlag(
      body.label,
      body.isActive,
      body.dependencies,
    );

    await this.auditService.log({
      userId: user.id,
      operation: 'Create Flag',
      entityType: 'Flag',
      entityId: flag.id,
      metadata: flag,
      reason: 'creating a new flag',
    });

    return apiResponse(res, {
      statusCode: HttpStatus.CREATED,
      message: 'Flag created successfully',
    });
  }

  @Post('/:id/activate')
  @UseGuards(JwtAuthGuard)
  async activateFlag(
    @AuthUser() user: User,
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    await this.flagsService.activateFlag(id);

    await this.auditService.log({
      userId: user.id,
      operation: 'Activate Flag',
      entityType: 'Flag',
      entityId: id,
      reason: 'activating a flag',
    });

    return apiResponse(res, {
      message: 'Flag activated successfully',
    });
  }

  @Post('/:id/deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivateFlag(
    @AuthUser() user: User,
    @Param('id') id: number,
    @Query('auto-disable') autoDisable: boolean = false,
    @Res() res: Response,
  ) {
    await this.flagsService.deactivateFlag(id, autoDisable);

    await this.auditService.log({
      userId: user.id,
      operation: 'Deactivate Flag',
      entityType: 'Flag',
      entityId: id,
      metadata: {
        autoDisable,
      },
      reason: 'deactivating a flag',
    });

    return apiResponse(res, {
      message: 'Flag deactivated successfully',
    });
  }

  @Post('/:id/update')
  @UseGuards(JwtAuthGuard)
  async updateDependencies(
    @AuthUser() user: User,
    @Param('id') id: number,
    @Body('dependencies') dependencies: number[],
    @Res() res: Response,
  ) {
    await this.flagsService.updateDependencies(id, dependencies);

    await this.auditService.log({
      userId: user.id,
      operation: 'Update Flag Dependencies',
      entityType: 'Flag',
      entityId: id,
      metadata: {
        dependencies,
      },
      reason: 'updating a flag dependencies and checking circular dependency',
    });

    return apiResponse(res, {
      message: 'Dependencies updated successfully',
    });
  }
}
