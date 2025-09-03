import TypeORM from 'typeorm';

export class Migrations1756902638599 implements TypeORM.MigrationInterface {
  name = 'Migrations1756902638599';

  public async up(queryRunner: TypeORM.QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" text NOT NULL, "email" text NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_51b8b26ac168fbe7d6f5653e6c" ON "users" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "plans" ("id" SERIAL NOT NULL, "name" text NOT NULL, "price_per_month" numeric(15,2) NOT NULL, "qr_code_limit" integer NOT NULL, CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD CONSTRAINT "UQ_253d25dae4c94ee913bc5ec4850" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_253d25dae4c94ee913bc5ec485" ON "plans" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" SERIAL NOT NULL, "plan_start_date" TIMESTAMP NOT NULL, "billing_cycle_start_date" TIMESTAMP NOT NULL, "billing_cycle_end_date" TIMESTAMP NOT NULL, "outstanding_credit" numeric(15,2) NOT NULL DEFAULT '0', "current_qrcode_usage" integer NOT NULL DEFAULT '0', "user_id" integer NOT NULL, "plan_id" integer NOT NULL, CONSTRAINT "REL_d0a95ef8a28188364c546eb65c" UNIQUE ("user_id"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f2f7a2f2970cee69f0c7c0937" ON "subscriptions" ("billing_cycle_start_date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "billing_records" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "amount" numeric(10,2) NOT NULL, "description" character varying NOT NULL, "subscription_id" integer, CONSTRAINT "PK_11e0a792cf3ae4ebcc71f7fa0ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_records" ADD CONSTRAINT "FK_508d0f4658cef1fa60f561b8aa4" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: TypeORM.QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing_records" DROP CONSTRAINT "FK_508d0f4658cef1fa60f561b8aa4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`,
    );
    await queryRunner.query(`DROP TABLE "billing_records"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f2f7a2f2970cee69f0c7c0937"`,
    );
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_253d25dae4c94ee913bc5ec485"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" DROP CONSTRAINT "UQ_253d25dae4c94ee913bc5ec4850"`,
    );
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_51b8b26ac168fbe7d6f5653e6c"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
