import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateGeneratedCertificatesTable1704067200003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'generated_certificates',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'certificate_id',
            type: 'int',
          },
          {
            name: 'attendee_id',
            type: 'int',
          },
          {
            name: 's3_url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'generated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'is_sent',
            type: 'boolean',
            default: false,
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
            name: 'idx_generated_certificates_certificate_id',
            columnNames: ['certificate_id'],
          },
          {
            name: 'idx_generated_certificates_attendee_id',
            columnNames: ['attendee_id'],
          },
        ],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'generated_certificates',
      new TableForeignKey({
        columnNames: ['certificate_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'certificates',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'generated_certificates',
      new TableForeignKey({
        columnNames: ['attendee_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'attendees',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('generated_certificates');
  }
}
