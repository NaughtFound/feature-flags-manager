import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Flag, FlagRepo } from '@app/db/entities/flag.entity';

@Injectable()
export class FlagsService {
  constructor(
    @InjectRepository(Flag)
    private flagRepo: FlagRepo,
  ) {}
}
