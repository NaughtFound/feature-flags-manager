import { Test, TestingModule } from '@nestjs/testing';
import { FlagsController } from './flags.controller';
import { FlagsService } from './flags.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Flag } from '@app/db/entities/flag.entity';

describe('FlagsController', () => {
  let controller: FlagsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlagsController],
      providers: [
        {
          provide: getRepositoryToken(Flag),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        FlagsService,
      ],
    }).compile();

    controller = module.get<FlagsController>(FlagsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
