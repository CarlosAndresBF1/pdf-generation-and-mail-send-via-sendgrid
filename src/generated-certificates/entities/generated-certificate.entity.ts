import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Certificate } from '../../certificates/entities/certificate.entity';
import { Attendee } from '../../attendees/entities/attendee.entity';

@Entity('generated_certificates')
export class GeneratedCertificate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'certificate_id' })
  certificateId: number;

  @Column({ name: 'attendee_id' })
  attendeeId: number;

  @Column({ name: 's3_url', length: 500 })
  s3Url: string;

  @Column({ name: 'generated_at' })
  generatedAt: Date;

  @Column({ name: 'is_sent', default: false })
  isSent: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(
    () => Certificate,
    (certificate) => certificate.generatedCertificates,
  )
  @JoinColumn({ name: 'certificate_id' })
  certificate: Certificate;

  @ManyToOne(() => Attendee, (attendee) => attendee.generatedCertificates)
  @JoinColumn({ name: 'attendee_id' })
  attendee: Attendee;

  @OneToOne('Job', 'generatedCertificate')
  job: any;
}
