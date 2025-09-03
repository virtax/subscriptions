import TypeORM from 'typeorm';

export class Migrations1756902639000 implements TypeORM.MigrationInterface {
  name = 'Migrations1756902639000';

  public async up(queryRunner: TypeORM.QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO plans (name, price_per_month, qr_code_limit) VALUES ('Basic', 10, 5);
       INSERT INTO plans (name, price_per_month, qr_code_limit) VALUES ('Pro', 25, 20);`,
    );
  }

  public async down(queryRunner: TypeORM.QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM plans WHERE name IN ('Basic', 'Pro');`,
    );
  }
}
