
export class AddXIntegration1770000000000 {
    name = 'AddXIntegration1770000000000'

    async up(queryRunner) {
        // Userテーブルにカラムを追加するSQL
        await queryRunner.query(`ALTER TABLE "user" ADD "xAccessToken" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "xAccessSecret" character varying(512)`);
    }

    async down(queryRunner) {
        // 変更を元に戻す場合のSQL
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "xAccessSecret"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "xAccessToken"`);
    }
}