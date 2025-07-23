import { Test, TestingModule } from '@nestjs/testing';
import { FlagsService } from './flags.service';
import { Flag, FlagRepo } from '@app/db/entities/flag.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { topologicalSort } from '@app/utils';
import { AuditService } from '@app/audit/audit.service';
import { AuditLog } from '@app/db/entities/log.entity';

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
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Flag),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FlagsService>(FlagsService);
    flagRepo = module.get(getRepositoryToken(Flag));

    service.findChildren = jest.fn();
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
    const flagC: Flag = {
      id: 3,
      label: 'C',
      isActive: true,
      dependencies: [flagA],
    };

    jest.spyOn(service, 'listFlags').mockResolvedValue([flagA, flagB]);
    flagRepo.save.mockResolvedValue(flagC);

    const result = await service.createFlag('C', true, [1]);

    expect(flagRepo.save).toHaveBeenCalledWith({
      label: 'C',
      isActive: true,
      dependencies: [flagA],
    });

    expect(result).toEqual(flagC);
  });

  it('should throw if dependency is not valid', async () => {
    const flagA: Flag = { id: 1, label: 'A', isActive: true, dependencies: [] };
    jest.spyOn(service, 'listFlags').mockResolvedValue([flagA]);

    await expect(service.createFlag('C', true, [2])).rejects.toThrow(
      'Dependency not found',
    );

    expect(flagRepo.save).not.toHaveBeenCalled();
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

    expect(flagRepo.save).not.toHaveBeenCalled();
  });

  it('should find the correct flag', async () => {
    const flagA: Flag = {
      id: 1,
      label: 'A',
      isActive: true,
      dependencies: [],
    };

    flagRepo.findOne.mockResolvedValue(flagA);

    const result = await service.findFlag(1);

    expect(flagRepo.findOne).toHaveBeenCalledWith({
      where: {
        id: flagA.id,
      },
      relations: { dependencies: true },
    });

    expect(result).toEqual(flagA);
  });

  it('should throw if flag not found', async () => {
    flagRepo.findOne.mockResolvedValue(null);

    await expect(service.findFlag(999)).rejects.toThrow('Flag not found');
    expect(flagRepo.save).not.toHaveBeenCalled();
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

    jest.spyOn(service, 'findFlag').mockResolvedValue(flagB);

    await service.activateFlag(2);

    expect(flagB.isActive).toBe(true);
    expect(flagRepo.save).toHaveBeenCalledWith(flagB);
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

    jest.spyOn(service, 'findFlag').mockResolvedValue(flagB);

    await expect(service.activateFlag(2)).rejects.toThrow(
      'You cannot activate this flag',
    );

    expect(flagRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if it has children and autoDisable=false', async () => {
    const flagA: Flag = {
      id: 1,
      label: 'A',
      isActive: false,
      dependencies: [],
    };

    jest.spyOn(service, 'findFlag').mockResolvedValue(flagA);
    jest.spyOn(service, 'hasChildren').mockResolvedValue(true);

    await expect(service.deactivateFlag(1, false)).rejects.toThrow(
      'You cannot disable this flag with autoDisable=false. Try autoDisable=True',
    );

    expect(flagRepo.update).not.toHaveBeenCalled();
  });

  it('should deactivate only the flag if it has no children', async () => {
    const flagA: Flag = {
      id: 1,
      label: 'A',
      isActive: false,
      dependencies: [],
    };

    jest.spyOn(service, 'findFlag').mockResolvedValue(flagA);
    jest.spyOn(service, 'hasChildren').mockResolvedValue(false);

    await service.deactivateFlag(1, false);

    expect(flagRepo.update).toHaveBeenCalledWith([1], { isActive: false });
  });

  it('should deactivate flag and descendants if has children and autoDisable=true', async () => {
    const flagA: Flag = {
      id: 1,
      label: 'A',
      isActive: false,
      dependencies: [],
    };

    jest.spyOn(service, 'findFlag').mockResolvedValue(flagA);
    jest.spyOn(service, 'hasChildren').mockResolvedValue(true);

    (service.findChildren as jest.Mock)
      .mockImplementationOnce(async (id: number) => [{ id: 2 }, { id: 3 }])
      .mockImplementationOnce(async (id: number) => [{ id: 4 }])
      .mockImplementationOnce(async () => [])
      .mockImplementationOnce(async () => []);

    await service.deactivateFlag(1, true);

    expect(flagRepo.update).toHaveBeenCalledWith([1, 2, 3, 4], {
      isActive: false,
    });
  });

  it('should update dependencies successfully', async () => {
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
      dependencies: [],
    };

    const flagC: Flag = {
      id: 3,
      label: 'C',
      isActive: true,
      dependencies: [],
    };

    jest.spyOn(service, 'findFlag').mockResolvedValue(flagA);
    jest.spyOn(service, 'listFlags').mockResolvedValue([flagA, flagB, flagC]);
    (service.findChildren as jest.Mock).mockResolvedValue([]);

    await service.updateDependencies(1, [2, 3]);

    expect(flagA.dependencies).toEqual([flagB, flagC]);
    expect(flagRepo.save).toHaveBeenCalledWith(flagA);
  });

  it('should throw if dependency is not valid', async () => {
    const flagA: Flag = { id: 1, label: 'A', isActive: true, dependencies: [] };

    jest.spyOn(service, 'findFlag').mockResolvedValue(flagA);
    jest.spyOn(service, 'listFlags').mockResolvedValue([flagA]);

    await expect(service.updateDependencies(1, [2])).rejects.toThrow(
      'Dependency not found',
    );

    expect(flagRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if circular dependency is detected', async () => {
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
      dependencies: [flagB],
    };

    jest.spyOn(service, 'findFlag').mockResolvedValue(flagA);
    jest.spyOn(service, 'listFlags').mockResolvedValue([flagA, flagB, flagC]);
    (service.findChildren as jest.Mock).mockImplementation(
      async (id: number) => {
        if (id == 1) return [flagB];
        if (id == 2) return [flagC];
        if (id == 3) return [];
      },
    );

    await expect(service.updateDependencies(1, [3])).rejects.toThrow(
      /Circular dependency detected/,
    );

    expect(flagRepo.save).not.toHaveBeenCalled();
  });
});
