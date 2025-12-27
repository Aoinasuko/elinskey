import { Injectable, Inject } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';

export const meta = {
    tags: ['integration'],
    requireCredential: true,
    prohibitMoved: true,
    kind: 'read:account',
    errors: {},
    res: {
        type: 'object',
        properties: {
            connected: { type: 'boolean' },
        },
        required: ['connected'],
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
            const user = await this.userRepository.findOneBy({ id: me.id });
            if (!user) return { connected: false };

            const connected = !!(user.xAccessToken);

            return {
                connected,
            };
        });
    }
}