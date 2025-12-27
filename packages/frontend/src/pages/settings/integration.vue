<template>
<SearchMarker path="/settings/integration" :label="i18n.ts.elinskey.integration.settingLabel" :keywords="['x']" icon="ti ti-brand-x">
    <div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/link_3d.png" color="#ff0088">
			<SearchText>{{i18n.ts.elinskey.integration.settingDesc}}</SearchText>
		</MkFeatureBanner>

        <SearchMarker :keywords="['x']">
			<FormSection>
				<template #label><i class="ti ti-brand-x"></i> <SearchLabel>{{i18n.ts.elinskey.integration.settingLabel}}</SearchLabel></template>
				<div class="_gaps_m">
					<div v-if="isConnected">
                        <div v-html="i18n.ts.elinskey.integration.settingConnectedDesc"></div>
                        <p></p>
                        <MkButton danger @click="disconnect"><SearchText>{{i18n.ts.elinskey.integration.disconnect}}</SearchText></MkButton>
                    </div>
                    <div v-else>
                        <div v-html="i18n.ts.elinskey.integration.settingNotConnectedDesc"></div>
                        <p></p>
                        <MkButton primary @click="connect"><SearchText>{{i18n.ts.elinskey.integration.connect}}</SearchText></MkButton>
                    </div>
				</div>
			</FormSection>
		</SearchMarker>
    </div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';
import FormSection from '@/components/form/section.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

const isConnected = ref(false);

onMounted(async () => {
    try {
        const res = await misskeyApi('i/x-integration-status');
        isConnected.value = res.connected;
    } catch (e) {
        return;
    }
});

const connect = async () => {
    try {
        const response = await misskeyApi('connect/x');

        if (response.url) {
            window.location.href = response.url;
        }
    } catch (err) {
        return;
    }
};

const disconnect = async () => {
    const { canceled } = await os.confirm({
        type: 'warning',
        text: i18n.ts.elinskey.integration.selectDisconnect,
    });
    if (canceled) return;

    try {
        await misskeyApi('connect/x-disconnect');

        isConnected.value = false;

        os.alert({
            type: 'success',
            text: i18n.ts.elinskey.integration.disconnectSuccess,
        });
    } catch (err: any) {
        os.alert({
            type: 'error',
            text: err.message || i18n.ts.elinskey.integration.disconnectFail,
        });
    }
};

</script>