import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  client: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'event_name', length: 255 })
  eventName: string;

  @Column({ name: 'base_design_url', length: 500 })
  baseDesignUrl: string;

  @Column({ name: 'pdf_template', length: 255 })
  pdfTemplate: string;

  @Column({ name: 'sender_from_name', length: 255, nullable: true })
  senderFromName: string;

  @Column({ name: 'sendgrid_template_id', length: 100 })
  sendgridTemplateId: string;

  @Column({ name: 'event_link', length: 500 })
  eventLink: string;

  @Column({ name: 'sender_email', length: 255, nullable: true })
  senderEmail: string;

  @Column({
    name: 'email_subject',
    length: 255,
    nullable: true,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  emailSubject: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('GeneratedCertificate', 'certificate')
  generatedCertificates: any[];
}
