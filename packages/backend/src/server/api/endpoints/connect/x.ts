
import { Injectable, Inject } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import * as Redis from 'ioredis';

export const meta = {
    tags: ['integration'],
    requireCredential: true,
    prohibitMoved: true,
    kind: 'write:account',
    errors: {},
    res: {
        type: 'object',
        properties: { url: { type: 'string' } },
        required: ['url'],
    },
} as const;

export const paramDef = { type: 'object', properties: {}, required: [] } as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
    constructor(
        @Inject(DI.config)
		private config: Config,

        @Inject(DI.redis)
        private redis: Redis.Redis,
    ) {
        super(meta, paramDef, async (ps, me) => {
            try {
                const client = new TwitterApi({
                    appKey: config.xIntegration.appKey,
                    appSecret: config.xIntegration.appSecret,
                });

                const callbackUrl = `${config.url}/settings/integration-callback`;

                const authLink = await client.generateAuthLink(callbackUrl, { linkMode: 'authorize' });

                await redis.set(`x_auth:${authLink.oauth_token}`, authLink.oauth_token_secret, 'EX', 600);
                await redis.set(`x_user:${authLink.oauth_token}`, me.id, 'EX', 600);

                return { url: authLink.url };
            } catch (e) {
                return e;
            }
        });
    }
}