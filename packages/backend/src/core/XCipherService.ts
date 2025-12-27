import { Injectable, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';

@Injectable()
export class XCipherService {
    private readonly algorithm = 'aes-256-cbc';
    private readonly key: Buffer;

    constructor(
        @Inject(DI.config)
        private config: Config,
    ) {
        this.key = crypto.createHash('sha256').update(this.config.xIntegration.encryptionKey).digest();
    }

    // 暗号
    public encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        return iv.toString('base64') + ':' + encrypted;
    }

    // 復号
    public decrypt(text: string): string {
        try {
            const parts = text.split(':');
            if (parts.length !== 2) throw new Error('Invalid format');

            const iv = Buffer.from(parts[0], 'base64');
            const encryptedText = parts[1];

            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

            let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (e) {
            throw new Error('Failed to decrypt token');
        }
    }
}
