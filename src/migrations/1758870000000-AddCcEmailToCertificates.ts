import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCcEmailToCertificates1758870000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'certificates',
      new TableColumn({
        name: 'cc_email',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('certificates', 'cc_email');
  }
}
