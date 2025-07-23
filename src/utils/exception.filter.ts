import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DetailedError } from './detailed.error';
import { QueryFailedError } from 'typeorm';

@Catch()
export class ThrowExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...details,
    });
  }
}
