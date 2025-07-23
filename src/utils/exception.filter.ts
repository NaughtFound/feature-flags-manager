import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DetailedError } from './detailed.error';
import { QueryFailedError } from 'typeorm';
import { AuditService } from '@app/audit/audit.service';

@Catch()
export class ThrowExceptionFilter implements ExceptionFilter {
  constructor(private readonly auditService: AuditService) {}

  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const user = (request as any).user;

    console.log(exception);

    let status = 500;
    let message: any = 'Internal server error';

    let details = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }
    if (exception instanceof DetailedError) {
      status = exception.code;
      message = exception.message;
      details = exception.details || {};
    }
    if (exception instanceof QueryFailedError) {
      status = 400;
      message = exception.message;
      details = {
        parameters: exception.parameters,
      };
    }

    await this.auditService.log({
      userId: user?.id,
      operation: request.url,
      entityType: 'Error',
      reason: message,
      metadata: {
        status,
        ...details,
      },
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...details,
    });
  }
}
