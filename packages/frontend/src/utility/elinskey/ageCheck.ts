
import { $i } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { claimAchievement } from '@/utility/achievements.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

// 年齢確認処理
export async function ageCheck(ev: MouseEvent | null, sensitive: boolean) : Promise<boolean> {

	// 18歳以上である事の確認をしていない場合
    if (sensitive && !$i.isSensitiveContentAllowed) {
        if (ev) {
            ev.stopPropagation();
        }
		// 18歳以上であるか確認を行うダイアログを表示
		const {canceled} = await os.confirm({
			type: 'warning',
			title: i18n.ts.elinskey.sensitivefilter.sensitivecheckLabel,
			text: i18n.ts.elinskey.sensitivefilter.sensitivecheckDesc,
			okText: i18n.ts.elinskey.sensitivefilter.sensitivecheckYes,
			cancelText: i18n.ts.no,
		});

        if (canceled) {
            return false;
        }

    	// はいが押されたら18歳以上であることを認証
    	try {
			await misskeyApi('i/update', {
				isSensitiveContentAllowed: true,
			});
			$i.isSensitiveContentAllowed = true;
            claimAchievement('elinskeyAgecheck');
		} catch (e) {
			os.alert({ type: 'error', text: 'failed setting' });
			return false;
        }
    }
    return true;
}

// 18歳以上であることを確認済み
export function isAgeChecked() : boolean {
    console.log($i.isSensitiveContentAllowed);
    return $i.isSensitiveContentAllowed;
}