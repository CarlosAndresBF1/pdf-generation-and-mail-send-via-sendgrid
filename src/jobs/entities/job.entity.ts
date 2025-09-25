import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

export enum JobStatus {
  PENDING = 'pending',
  SENT = 'sent',
  ERROR = 'error',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'generated_certificate_id' })
  generatedCertificateId: number;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @Column({ name: 'attempted_at', nullable: true })
  attemptedAt?: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne('GeneratedCertificate', 'job')
  @JoinColumn({ name: 'generated_certificate_id' })
  generatedCertificate: any;
}
