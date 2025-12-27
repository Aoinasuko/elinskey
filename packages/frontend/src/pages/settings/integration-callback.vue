<template>
    <div class="mk-x-callback">
        <MkLoading v-if="processing" />
        <div v-else>
            <p v-if="success"><SearchText>{{i18n.ts.elinskey.integration.connectSuccess}}</SearchText></p>
            <p v-else><SearchText>{{i18n.ts.elinskey.integration.connectFail}}</SearchText></p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from '@/router.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';

const processing = ref(true);
const success = ref(false);
const errorMsg = ref('');

const router = useRouter();

onMounted(async () => {
	const searchParams = new URLSearchParams(window.location.search);

	const oauth_token = searchParams.get('oauth_token');
    const oauth_verifier = searchParams.get('oauth_verifier');

	if (!oauth_token || !oauth_verifier) {
		processing.value = false;
		return;
	}

	try {
		await misskeyApi('connect/x-callback', {
			oauth_token,
            oauth_verifier
		});

		success.value = true;

		// 2秒後に設定画面に戻る
		window.setTimeout(() => {
			router.push('/settings/integration');
		}, 2000);

	} catch (err: any) {
		console.error(err);
		processing.value = false;
		errorMsg.value = err.message || 'Unknown error';
	}
});
</script>