import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCustomFieldsToAttendees1758860000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'attendees',
      new TableColumn({
        name: 'link_1',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'attendees',
      new TableColumn({
        name: 'link_2',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'attendees',
      new TableColumn({
        name: 'custom_1',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'attendees',
      new TableColumn({
        name: 'custom_2',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('attendees', 'link_1');
    await queryRunner.dropColumn('attendees', 'link_2');
    await queryRunner.dropColumn('attendees', 'custom_1');
    await queryRunner.dropColumn('attendees', 'custom_2');
  }
}
