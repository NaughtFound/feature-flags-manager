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

    if (flag == null) throw Error('Flag not found');

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

    for (const parent of flag.dependencies) {
      if (parent.isActive) continue;
      throw Error('You cannot activate this flag');
    }

    flag.isActive = true;

    await this.flagRepo.save(flag);
  }

  async deactivateFlag(id: number, autoDisable: boolean = false) {
    const flag = await this.findFlag(id);
    const hasChildren = await this.hasChildren(id);

    if (hasChildren && !autoDisable)
      throw Error(
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
      throw Error('Dependency not found');
    }

    const parents = dependencies.map((index) => {
      const p = flagIndex.get(index)!;
      return flags[p];
    });

    const stack: number[] = [flag.id];
    const visited = new Set<number>();
    const shouldCheck: number[] = [];

    for (const parent of parents) {
      const pid = flagIndex.get(parent.id)!;
      if (pid < cid) continue;
      if (pid == cid)
        throw Error(
          `Circular dependency detected. Cannot add ${parent.label} as a dependency`,
        );

      shouldCheck.push(parent.id);
    }

    while (stack.length > 0) {
      const cid = stack.pop()!;
      if (visited.has(cid)) continue;
      visited.add(cid);

      const children = await this.findChildren(cid);

      for (const child of children) {
        if (visited.has(child.id)) continue;
        if (shouldCheck.includes(child.id))
          throw Error(
            `Circular dependency detected. Cannot add ${child.label} as a dependency`,
          );
        stack.push(child.id);
      }
    }

    flag.dependencies = parents;

    await this.flagRepo.save(flag);
  }
}
