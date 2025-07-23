import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  Repository,
  JoinTable,
} from 'typeorm';

@Entity()
export class Flag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  label: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Flag, (flag) => flag.dependencies)
  @JoinTable()
  dependencies: Flag[];
}

export type FlagRepo = Repository<Flag>;
