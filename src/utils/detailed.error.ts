import { HttpStatus } from '@nestjs/common';

export class DetailedError extends Error {
  code: HttpStatus;
  details?: object;

  constructor(
    message: string,
    options?: {
      details?: object;
      code?: HttpStatus;
    },
  ) {
    super(message);
    this.name = 'DetailedError';
    this.code = options?.code || HttpStatus.BAD_REQUEST;
    this.details = options?.details || {};

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
