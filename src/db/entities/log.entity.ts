import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Repository,
} from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  operation: string;

  @Column({ nullable: true })
  entityType?: string;

  @Column({ nullable: true })
  entityId?: number;

  @Column({ nullable: true })
  userId?: number;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;
}

export type AuditLogRepo = Repository<AuditLog>;
