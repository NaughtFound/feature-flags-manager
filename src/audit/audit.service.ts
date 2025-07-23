import { AuditLog, AuditLogRepo } from '@app/db/entities/log.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: AuditLogRepo,
  ) {}

  async log({
    operation,
    entityType,
    entityId,
    userId,
    reason,
    metadata,
  }: {
    operation: string;
    entityType?: string;
    entityId?: number;
    userId?: number;
    reason?: string;
    metadata?: any;
  }) {
    const log = this.auditRepo.create({
      operation,
      entityType,
      entityId,
      userId,
      reason,
      metadata,
    });

    await this.auditRepo.save(log);
  }
}
