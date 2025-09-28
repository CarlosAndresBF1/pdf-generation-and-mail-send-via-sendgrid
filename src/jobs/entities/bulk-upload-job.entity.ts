import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BulkUploadJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('bulk_upload_jobs')
export class BulkUploadJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'filename' })
  filename: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: BulkUploadJobStatus,
    default: BulkUploadJobStatus.PENDING,
  })
  status: BulkUploadJobStatus;

  @Column({ name: 'total_records', nullable: true })
  totalRecords: number;

  @Column({ nullable: true })
  created: number;

  @Column({ nullable: true })
  updated: number;

  @Column({ nullable: true })
  errors: number;

  @Column({ name: 'certificates_associated', nullable: true })
  certificatesAssociated: number;

  @Column({ name: 'error_details', type: 'longtext', nullable: true })
  errorDetails: string; // JSON string

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
