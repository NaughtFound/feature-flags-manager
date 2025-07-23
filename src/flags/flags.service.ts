import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Flag, FlagRepo } from '@app/db/entities/flag.entity';
import { topologicalSort } from '@app/utils';
import { DetailedError } from '@app/utils/detailed.error';

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
      throw new DetailedError('Dependency not found', {
        code: HttpStatus.NOT_FOUND,
      });
    }

    const parents = dependencies.map((index) => {
      const p = flagIndex.get(index)!;
      return flags[p];
    });

    if (isActive) {
      for (const parent of parents) {
        if (parent.isActive) continue;
        throw new DetailedError('You cannot create this as an active flag');
      }
    }

    await this.flagRepo.save({
      label,
      isActive,
      dependencies: parents,
    });
  }

  async findFlag(id: number) {
    const flag = await this.flagRepo.findOne({
      where: {
        id,
      },
      relations: {
        dependencies: true,
      },
    });

    if (flag == null)
      throw new DetailedError('Flag not found', { code: HttpStatus.NOT_FOUND });

    return flag;
  }

  async hasChildren(id: number) {
    const count = await this.flagRepo
      .createQueryBuilder('flag')
      .innerJoin('flag.dependencies', 'dependency')
      .where('dependency.id = :id', { id })
      .getCount();

    return count > 0;
  }

  async findChildren(id: number) {
    return this.flagRepo
      .createQueryBuilder('flag')
      .innerJoin('flag.dependencies', 'dependency')
      .where('dependency.id = :id', { id })
      .getMany();
  }

  async activateFlag(id: number) {
    const flag = await this.findFlag(id);

    let shouldThrow = false;
    const missingDependencies: object[] = [];

    for (const parent of flag.dependencies) {
      if (parent.isActive) continue;
      shouldThrow = true;
      missingDependencies.push({
        id: parent.id,
        label: parent.label,
      });
    }

    if (shouldThrow)
      throw new DetailedError('You cannot activate this flag', {
        details: {
          missingDependencies,
        },
      });

    flag.isActive = true;

    await this.flagRepo.save(flag);
  }

  async deactivateFlag(id: number, autoDisable: boolean = false) {
    const flag = await this.findFlag(id);
    const hasChildren = await this.hasChildren(id);

    if (hasChildren && !autoDisable)
      throw new DetailedError(
        'You cannot disable this flag with autoDisable=false. Try autoDisable=True',
      );

    const toDisable = [flag.id];
    const stack: number[] = [];
    const visited = new Set<number>();

    if (hasChildren) stack.push(flag.id);

    while (stack.length > 0) {
      const cid = stack.pop()!;
      if (visited.has(cid)) continue;
      visited.add(cid);

      const children = await this.findChildren(cid);

      for (const child of children) {
        if (visited.has(child.id)) continue;
        toDisable.push(child.id);
        stack.push(child.id);
      }
    }

    await this.flagRepo.update(toDisable, {
      isActive: false,
    });
  }

  async updateDependencies(id: number, dependencies: number[]) {
    const flag = await this.findFlag(id);
    const flags = await this.listFlags();
    const n = flags.length;

    const flagIndex = new Map<number, number>();

    for (let i = 0; i < n; i++) {
      const u = flags[i];
      flagIndex.set(u.id, i);
    }

    const cid = flagIndex.get(flag.id)!;

    for (const d of dependencies) {
      if (flagIndex.has(d)) continue;
      throw new DetailedError('Dependency not found', {
        code: HttpStatus.NOT_FOUND,
      });
    }

    const parents = dependencies.map((index) => {
      const p = flagIndex.get(index)!;
      return flags[p];
    });

    const stack: number[] = [flag.id];
    const visited = new Set<number>();
    const shouldCheck: number[] = [];

    let shouldThrow = false;
    const badFlags: object[] = [];

    for (const parent of parents) {
      const pid = flagIndex.get(parent.id)!;
      if (pid < cid) continue;
      if (pid == cid) {
        shouldThrow = true;
        badFlags.push({
          id: parent.id,
          label: parent.label,
        });
      }

      shouldCheck.push(parent.id);
    }

    while (stack.length > 0) {
      const cid = stack.pop()!;
      if (visited.has(cid)) continue;
      visited.add(cid);

      const children = await this.findChildren(cid);

      for (const child of children) {
        if (visited.has(child.id)) continue;
        if (shouldCheck.includes(child.id)) {
          shouldThrow = true;
          badFlags.push({
            id: child.id,
            label: child.label,
          });
        }
        stack.push(child.id);
      }
    }

    if (shouldThrow)
      throw new DetailedError(`Circular dependency detected`, {
        details: {
          badFlags,
        },
      });

    flag.dependencies = parents;

    await this.flagRepo.save(flag);
  }
}
