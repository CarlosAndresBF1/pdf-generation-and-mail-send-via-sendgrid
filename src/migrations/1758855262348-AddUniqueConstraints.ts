import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraints1758855262348 implements MigrationInterface {
  name = 'AddUniqueConstraints1758855262348';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` DROP FOREIGN KEY \`FK_76b4d9e7bb0856cbbd2ecdacb74\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` DROP FOREIGN KEY \`FK_77ec1e6c96c8f442c72bc45d9bc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`jobs\` DROP FOREIGN KEY \`FK_1334a3551eccdcbcb2067016ed7\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_certificates_client\` ON \`certificates\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_certificates_is_active\` ON \`certificates\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_attendees_document_number\` ON \`attendees\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_attendees_email\` ON \`attendees\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_generated_certificates_attendee_id\` ON \`generated_certificates\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_generated_certificates_certificate_id\` ON \`generated_certificates\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_jobs_generated_certificate_id\` ON \`jobs\``,
    );
    await queryRunner.query(`DROP INDEX \`idx_jobs_status\` ON \`jobs\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_BULK_UPLOAD_JOBS_STATUS\` ON \`bulk_upload_jobs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_BULK_UPLOAD_JOBS_USER_ID\` ON \`bulk_upload_jobs\``,
    );
    await queryRunner.query(`DROP INDEX \`idx_users_email\` ON \`users\``);
    await queryRunner.query(`DROP INDEX \`idx_users_user_name\` ON \`users\``);
    await queryRunner.query(
      `DROP INDEX \`UQ_074a1f262efaca6aba16f7ed920\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`UQ_97672ac88f789774dd47f7c8be3\` ON \`users\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificates\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificates\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificates\` DROP COLUMN \`updated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificates\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendees\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendees\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendees\` DROP COLUMN \`updated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendees\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` DROP COLUMN \`generated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` ADD \`generated_at\` datetime NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` DROP COLUMN \`updated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`jobs\` ADD UNIQUE INDEX \`IDX_1334a3551eccdcbcb2067016ed\` (\`generated_certificate_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`jobs\` DROP COLUMN \`attempted_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`jobs\` ADD \`attempted_at\` datetime NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`jobs\` DROP COLUMN \`created_at\``);
    await queryRunner.query(
      `ALTER TABLE \`jobs\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` DROP COLUMN \`started_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` ADD \`started_at\` datetime NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` DROP COLUMN \`completed_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` ADD \`completed_at\` datetime NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` DROP COLUMN \`error_message\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` ADD \`error_message\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` DROP COLUMN \`updated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_074a1f262efaca6aba16f7ed92\` (\`user_name\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`)`,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`created_at\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`updated_at\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_a9dc99527462ef05a3beee813b\` ON \`generated_certificates\` (\`certificate_id\`, \`attendee_id\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`REL_1334a3551eccdcbcb2067016ed\` ON \`jobs\` (\`generated_certificate_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` ADD CONSTRAINT \`FK_77ec1e6c96c8f442c72bc45d9bc\` FOREIGN KEY (\`certificate_id\`) REFERENCES \`certificates\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` ADD CONSTRAINT \`FK_76b4d9e7bb0856cbbd2ecdacb74\` FOREIGN KEY (\`attendee_id\`) REFERENCES \`attendees\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`jobs\` ADD CONSTRAINT \`FK_1334a3551eccdcbcb2067016ed7\` FOREIGN KEY (\`generated_certificate_id\`) REFERENCES \`generated_certificates\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`jobs\` DROP FOREIGN KEY \`FK_1334a3551eccdcbcb2067016ed7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` DROP FOREIGN KEY \`FK_76b4d9e7bb0856cbbd2ecdacb74\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` DROP FOREIGN KEY \`FK_77ec1e6c96c8f442c72bc45d9bc\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_1334a3551eccdcbcb2067016ed\` ON \`jobs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a9dc99527462ef05a3beee813b\` ON \`generated_certificates\``,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`updated_at\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`updated_at\` timestamp(0) NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`created_at\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`created_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP INDEX \`IDX_074a1f262efaca6aba16f7ed92\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` DROP COLUMN \`updated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` ADD \`updated_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` ADD \`created_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` DROP COLUMN \`error_message\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` ADD \`error_message\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` DROP COLUMN \`completed_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` ADD \`completed_at\` timestamp NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` DROP COLUMN \`started_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bulk_upload_jobs\` ADD \`started_at\` timestamp NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`jobs\` DROP COLUMN \`created_at\``);
    await queryRunner.query(
      `ALTER TABLE \`jobs\` ADD \`created_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`jobs\` DROP COLUMN \`attempted_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`jobs\` ADD \`attempted_at\` timestamp NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`jobs\` DROP INDEX \`IDX_1334a3551eccdcbcb2067016ed\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` DROP COLUMN \`updated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` ADD \`updated_at\` timestamp(0) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` ADD \`created_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` DROP COLUMN \`generated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` ADD \`generated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendees\` DROP COLUMN \`updated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendees\` ADD \`updated_at\` timestamp(0) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendees\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendees\` ADD \`created_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificates\` DROP COLUMN \`updated_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificates\` ADD \`updated_at\` timestamp(0) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificates\` DROP COLUMN \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificates\` ADD \`created_at\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_97672ac88f789774dd47f7c8be3\` ON \`users\` (\`email\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_074a1f262efaca6aba16f7ed920\` ON \`users\` (\`user_name\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_users_user_name\` ON \`users\` (\`user_name\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_users_email\` ON \`users\` (\`email\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_BULK_UPLOAD_JOBS_USER_ID\` ON \`bulk_upload_jobs\` (\`user_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_BULK_UPLOAD_JOBS_STATUS\` ON \`bulk_upload_jobs\` (\`status\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_jobs_status\` ON \`jobs\` (\`status\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_jobs_generated_certificate_id\` ON \`jobs\` (\`generated_certificate_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_generated_certificates_certificate_id\` ON \`generated_certificates\` (\`certificate_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_generated_certificates_attendee_id\` ON \`generated_certificates\` (\`attendee_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_attendees_email\` ON \`attendees\` (\`email\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_attendees_document_number\` ON \`attendees\` (\`document_number\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_certificates_is_active\` ON \`certificates\` (\`is_active\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`idx_certificates_client\` ON \`certificates\` (\`client\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`jobs\` ADD CONSTRAINT \`FK_1334a3551eccdcbcb2067016ed7\` FOREIGN KEY (\`generated_certificate_id\`) REFERENCES \`generated_certificates\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` ADD CONSTRAINT \`FK_77ec1e6c96c8f442c72bc45d9bc\` FOREIGN KEY (\`certificate_id\`) REFERENCES \`certificates\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` ADD CONSTRAINT \`FK_76b4d9e7bb0856cbbd2ecdacb74\` FOREIGN KEY (\`attendee_id\`) REFERENCES \`attendees\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
