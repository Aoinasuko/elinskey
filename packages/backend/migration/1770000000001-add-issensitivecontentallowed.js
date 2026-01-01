
export class AddisSensitiveContentAllowed1770000000001 {
    name = 'AddisSensitiveContentAllowed1770000000001'

    async up(queryRunner) {
        // Userテーブルにカラムを追加するSQL
        await queryRunner.query(`ALTER TABLE "user" ADD "isSensitiveContentAllowed" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        // 変更を元に戻す場合のSQL
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isSensitiveContentAllowed"`);
    }
}