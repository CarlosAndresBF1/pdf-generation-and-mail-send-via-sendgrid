import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUpdatedAtColumns1704067300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fix updated_at column in users table
    await queryRunner.query(
      `ALTER TABLE \`users\` MODIFY COLUMN \`updated_at\` timestamp NULL`,
    );

    // Fix updated_at column in certificates table
    await queryRunner.query(
      `ALTER TABLE \`certificates\` MODIFY COLUMN \`updated_at\` timestamp NULL`,
    );

    // Fix updated_at column in attendees table
    await queryRunner.query(
      `ALTER TABLE \`attendees\` MODIFY COLUMN \`updated_at\` timestamp NULL`,
    );

    // Fix updated_at column in generated_certificates table
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` MODIFY COLUMN \`updated_at\` timestamp NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert updated_at column in users table
    await queryRunner.query(
      `ALTER TABLE \`users\` MODIFY COLUMN \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    );

    // Revert updated_at column in certificates table
    await queryRunner.query(
      `ALTER TABLE \`certificates\` MODIFY COLUMN \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    );

    // Revert updated_at column in attendees table
    await queryRunner.query(
      `ALTER TABLE \`attendees\` MODIFY COLUMN \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    );

    // Revert updated_at column in generated_certificates table
    await queryRunner.query(
      `ALTER TABLE \`generated_certificates\` MODIFY COLUMN \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    );
  }
}