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
}
