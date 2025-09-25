import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSenderEmailToCertificates1758842143000
  implements MigrationInterface
{
  name = 'AddSenderEmailToCertificates1758842143000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`certificates\` ADD \`sender_email\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`certificates\` DROP COLUMN \`sender_email\``,
    );
  }
}
