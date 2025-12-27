
import { Injectable, Inject  } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import * as Redis from 'ioredis';
import type { UsersRepository } from '@/models/_.js';
import { XCipherService } from '@/core/XCipherService.js';

// エンドポイントの定義情報
export const meta = {
    tags: ['integration'],
    requireCredential: true,
    prohibitMoved: true,
    kind: 'write:account',
    errors: {
        invalidState: {
            message: 'Invalid state or session expired.',
            code: 'INVALID_STATE',
            id: 'x-auth-invalid-state',
        },
        authFailed: {
            message: 'Failed to authenticate with X.',
            code: 'AUTH_FAILED',
            id: 'x-auth-failed',
        }
    },
    res: {
        type: 'object',
        optional: false,
        nullable: false,
    },
} as const;

export const paramDef = {
    type: 'object',
    properties: {
        oauth_token: { type: 'string' },
        oauth_verifier: { type: 'string' },
    },
    required: ['oauth_token', 'oauth_verifier'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
    constructor(
        @Inject(DI.config)
		private config: Config,

        @Inject(DI.usersRepository)
        private usersRepository: UsersRepository,

        @Inject(DI.redis)
        private redis: Redis.Redis,

        private xCipherService: XCipherService,
    ) {
        super(meta, paramDef, async (ps, me) => {
            const { oauth_token, oauth_verifier } = ps;

            // RedisからSecretを取得
            const secret = await redis.get(`x_auth:${oauth_token}`);
            const initiatorUserId = await redis.get(`x_user:${oauth_token}`);

            if (!secret || !initiatorUserId || initiatorUserId !== me.id) {
                throw new ApiError({ message: 'Invalid token', code: 'INVALID_TOKEN', id: 'x-invalid' });
            }

            // 一時クライアント作成
            const client = new TwitterApi({
                appKey: config.xIntegration.appKey,
                appSecret: config.xIntegration.appSecret,
                accessToken: oauth_token,
                accessSecret: secret,
            });

            // アクセストークン交換
            const { accessToken, accessSecret } = await client.login(oauth_verifier);

            const callbackUrl = `${config.url}/settings/integration-callback`;

            // 暗号化して保存 (Secretも保存する)
            await this.usersRepository.update(me.id, {
                xAccessToken: this.xCipherService.encrypt(accessToken),
                xAccessSecret: this.xCipherService.encrypt(accessSecret),
            });

            // Redis掃除
            await redis.del(`x_auth:${oauth_token}`);
            await redis.del(`x_user:${oauth_token}`);

            return;
        });
    }
}