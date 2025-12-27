import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';

export const meta = {
    tags: ['integration'],
    requireCredential: true,
    prohibitMoved: true,
    kind: 'write:account', // アカウント情報の書き換えなので write:account
    errors: {},
    res: {
        type: 'object',
        properties: {},
        optional: false,
        nullable: false,
    },
} as const;

export const paramDef = {
    type: 'object',
    properties: {},
    required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
    constructor(
        @Inject(DI.usersRepository)
        private userRepository: UsersRepository,
    ) {
        super(meta, paramDef, async (ps, me) => {
            // DBのカラムを null にして連携情報を削除
            await this.userRepository.update(me.id, {
                xAccessToken: null,
            });

            return {};
        });
    }
}