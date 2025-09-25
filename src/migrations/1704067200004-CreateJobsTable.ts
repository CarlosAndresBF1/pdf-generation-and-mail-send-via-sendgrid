import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateJobsTable1704067200004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'jobs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'generated_certificate_id',
            type: 'int',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'sent', 'error'],
            default: "'pending'",
          },
          {
            name: 'attempted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'idx_jobs_generated_certificate_id',
            columnNames: ['generated_certificate_id'],
          },
          {
            name: 'idx_jobs_status',
            columnNames: ['status'],
          },
        ],
      }),
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'jobs',
      new TableForeignKey({
        columnNames: ['generated_certificate_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'generated_certificates',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('jobs');
  }
}
