import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateBulkUploadJobs1732581600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bulk_upload_jobs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'user_id',
            type: 'int',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: "'pending'",
          },
          {
            name: 'total_records',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'updated',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'errors',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'certificates_associated',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'error_details',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
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
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_BULK_UPLOAD_JOBS_USER_ID',
            columnNames: ['user_id'],
          },
          {
            name: 'IDX_BULK_UPLOAD_JOBS_STATUS',
            columnNames: ['status'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('bulk_upload_jobs');
  }
}
