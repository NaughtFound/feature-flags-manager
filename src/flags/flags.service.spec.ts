import { Test, TestingModule } from '@nestjs/testing';
import { FlagsService } from './flags.service';
import { Flag, FlagRepo } from '@app/db/entities/flag.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { topologicalSort } from '@app/utils';

jest.mock('@app/utils', () => ({
  topologicalSort: jest.fn(),
}));

describe('FlagsService', () => {
  let service: FlagsService;
  let flagRepo: jest.Mocked<FlagRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlagsService,
        {
          provide: getRepositoryToken(Flag),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FlagsService>(FlagsService);
    flagRepo = module.get(getRepositoryToken(Flag));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return flags in topological order', async () => {
    const flagA: Flag = {
      id: 1,
      label: 'A',
      isActive: true,
      dependencies: [],
    };

    const flagB: Flag = {
      id: 2,
      label: 'B',
      isActive: true,
      dependencies: [flagA],
    };

    const flagC: Flag = {
      id: 3,
      label: 'C',
      isActive: true,
      dependencies: [flagA, flagB],
    };

    const flagD: Flag = {
      id: 4,
      label: 'D',
      isActive: true,
      dependencies: [flagA],
    };

    const flags = [flagA, flagB, flagC, flagD];

    flagRepo.find.mockResolvedValue(flags);

    (topologicalSort as jest.Mock).mockReturnValue([0, 1, 3, 2]);

    const result = await service.listFlags();

    expect(flagRepo.find).toHaveBeenCalledWith({
      relations: { dependencies: true },
    });

    expect(topologicalSort).toHaveBeenCalledWith([
      [0, 1, 1, 1],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);

    expect(result).toEqual([flagA, flagB, flagD, flagC]);
  });
});
