import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Flag, FlagRepo } from '@app/db/entities/flag.entity';
import { topologicalSort } from '@app/utils';

@Injectable()
export class FlagsService {
  constructor(
    @InjectRepository(Flag)
    private flagRepo: FlagRepo,
  ) {}

  async listFlags() {
    const flags = await this.flagRepo.find({
      relations: {
        dependencies: true,
      },
    });

    const n = flags.length;

    const adjMatrix: number[][] = Array.from({ length: n }, () =>
      Array(n).fill(0),
    );

    const flagIndex = new Map<number, number>();

    for (let i = 0; i < n; i++) {
      const u = flags[i];
      flagIndex.set(u.id, i);
    }

    for (let i = 0; i < n; i++) {
      const u = flags[i];
      for (const parent of u.dependencies) {
        const p = flagIndex.get(parent.id)!;
        adjMatrix[p][i] = 1;
      }
    }

    const order = topologicalSort(adjMatrix);

    return order.map((index) => flags[index]);
  }

  async createFlag(
    label: string,
    isActive: boolean = true,
    dependencies: number[] = [],
  ) {
    const flags = await this.listFlags();
    const n = flags.length;

    const flagIndex = new Map<number, number>();

    for (let i = 0; i < n; i++) {
      const u = flags[i];
      flagIndex.set(u.id, i);
    }

    for (const d of dependencies) {
      if (flagIndex.has(d)) continue;
      throw Error('Dependency not found');
    }

    const parents = dependencies.map((index) => {
      const p = flagIndex.get(index)!;
      return flags[p];
    });

    if (isActive) {
      for (const parent of parents) {
        if (parent.isActive) continue;
        throw Error('You cannot create this as an active flag');
      }
    }

    this.flagRepo.create({
      label,
      isActive,
      dependencies: parents,
    });
  }

  async activateFlag(id: number) {
    const flag = await this.flagRepo.findOne({
      where: {
        id,
      },
      relations: {
        dependencies: true,
      },
    });

    if (flag == null) throw Error('Flag not found');

    for (const parent of flag.dependencies) {
      if (parent.isActive) continue;
      throw Error('You cannot activate this flag');
    }

    flag.isActive = true;

    await this.flagRepo.save(flag);
  }
}
