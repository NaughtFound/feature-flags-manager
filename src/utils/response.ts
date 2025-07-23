import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';

export class ApiResponseDto<T> {
  statusCode: number;
  message?: string;
  data?: T;
}

export function apiResponse<T>(
  res: Response,
  options: {
    statusCode?: number;
    message?: string;
    data?: T;
  },
): Response {
  const {
    statusCode = HttpStatus.OK,
    message = undefined,
    data = undefined,
  } = options;

  const result: ApiResponseDto<T> = {
    statusCode,
    message,
    data,
  };

  return res.status(result.statusCode).json(result);
}
