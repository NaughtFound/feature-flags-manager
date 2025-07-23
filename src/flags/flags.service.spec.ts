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
            create: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
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

  it('should create a flag with correct dependencies', async () => {
    const flagA: Flag = {
      id: 1,
      label: 'A',
      isActive: true,
      dependencies: [],
    };
    const flagB: Flag = { id: 2, label: 'B', isActive: true, dependencies: [] };

    jest.spyOn(service, 'listFlags').mockResolvedValue([flagA, flagB]);

    await service.createFlag('C', true, [1]);

    expect(flagRepo.create).toHaveBeenCalledWith({
      label: 'C',
      isActive: true,
      dependencies: [flagA],
    });
  });

  it('should throw if dependency is not valid', async () => {
    const flagA: Flag = { id: 1, label: 'A', isActive: true, dependencies: [] };
    jest.spyOn(service, 'listFlags').mockResolvedValue([flagA]);

    await expect(service.createFlag('C', true, [2])).rejects.toThrow(
      'Dependency not found',
    );

    expect(flagRepo.create).not.toHaveBeenCalled();
  });

  it('should throw if dependency is not active for newly active flag', async () => {
    const flagA: Flag = {
      id: 1,
      label: 'A',
      isActive: false,
      dependencies: [],
    };
    jest.spyOn(service, 'listFlags').mockResolvedValue([flagA]);

    await expect(service.createFlag('C', true, [1])).rejects.toThrow(
      'You cannot create this as an active flag',
    );

    expect(flagRepo.create).not.toHaveBeenCalled();
  });

  it('should activate a flag when all dependencies are active', async () => {
    const flagA: Flag = {
      id: 1,
      label: 'A',
      isActive: true,
      dependencies: [],
    };
    const flagB: Flag = {
      id: 2,
      label: 'B',
      isActive: false,
      dependencies: [flagA],
    };

    flagRepo.findOne.mockResolvedValue(flagB);

    await service.activateFlag(2);

    expect(flagB.isActive).toBe(true);
    expect(flagRepo.save).toHaveBeenCalledWith({
      ...flagB,
      isActive: true,
    });
  });

  it('should throw if flag not found', async () => {
    flagRepo.findOne.mockResolvedValue(null);

    await expect(service.activateFlag(999)).rejects.toThrow('Flag not found');
    expect(flagRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if any dependency is inactive', async () => {
    const flagA: Flag = {
      id: 1,
      label: 'A',
      isActive: false,
      dependencies: [],
    };
    const flagB: Flag = {
      id: 2,
      label: 'B',
      isActive: false,
      dependencies: [flagA],
    };

    flagRepo.findOne.mockResolvedValue(flagB);

    await expect(service.activateFlag(2)).rejects.toThrow(
      'You cannot activate this flag',
    );

    expect(flagRepo.save).not.toHaveBeenCalled();
  });
});
