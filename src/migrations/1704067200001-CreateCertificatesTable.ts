import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCertificatesTable1704067200001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'certificates',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'client',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'event_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'base_design_url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'pdf_template',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'sendgrid_template_id',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'event_link',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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
            name: 'idx_certificates_client',
            columnNames: ['client'],
          },
          {
            name: 'idx_certificates_is_active',
            columnNames: ['is_active'],
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('certificates');
  }
}
