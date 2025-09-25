import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('attendees')
export class Attendee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ name: 'first_name', length: 100, nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName?: string;

  @Column({ length: 255 })
  country: string;

  @Column({ name: 'document_type', length: 50 })
  documentType: string;

  @Column({ name: 'document_number', length: 100 })
  documentNumber: string;

  @Column({ length: 50 })
  gender: string;

  @Column({ length: 255 })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('GeneratedCertificate', 'attendee')
  generatedCertificates: any[];
}
