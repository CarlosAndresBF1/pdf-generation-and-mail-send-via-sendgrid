import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSenderFromNameToCertificates1758849000000
  implements MigrationInterface
{
  name = 'AddSenderFromNameToCertificates1758849000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`certificates\` ADD \`sender_from_name\` varchar(255) NULL AFTER \`pdf_template\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`certificates\` DROP COLUMN \`sender_from_name\``,
    );
  }
}
