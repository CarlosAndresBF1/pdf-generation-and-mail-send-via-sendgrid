import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailSubjectToCertificates1758845000000
  implements MigrationInterface
{
  name = 'AddEmailSubjectToCertificates1758845000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`certificates\` ADD \`email_subject\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER \`sender_email\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`certificates\` DROP COLUMN \`email_subject\``,
    );
  }
}
