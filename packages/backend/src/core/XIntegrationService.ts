import { Inject, Injectable } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';
import type { Config } from '@/config.js';
import type {DriveFilesRepository} from '@/models/_.js';
import * as fs from 'fs';
import got from 'got';
import { Stream } from 'stream';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';
import { XCipherService } from '@/core/XCipherService.js';

@Injectable()
export class XIntegrationService {
    constructor(
		@Inject(DI.config)
        private config: Config,

        @Inject(DI.usersRepository)
        private userRepository: UsersRepository,

        private xCipherService: XCipherService,
    ) {}

    // ユーザー情報からクライアント生成
    private async getClient(userOrId: any): Promise<TwitterApi | null> {
        const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
        const user = await this.userRepository.findOneBy({ id: userId });

        if (!user || !user.xAccessToken || !user.xAccessSecret) return null;

        try {
            const accessToken = this.xCipherService.decrypt(user.xAccessToken);
            const accessSecret = this.xCipherService.decrypt(user.xAccessSecret);

            return new TwitterApi({
                appKey: this.config.xIntegration.appKey,
                appSecret: this.config.xIntegration.appSecret,
                accessToken: accessToken.trim(),
                accessSecret: accessSecret.trim(),
            });
        } catch (e) {
            return null;
        }
    }

    // ファイル取得
    private async getFileBuffer(file: DriveFilesRepository): Promise<Buffer> {
        const url = file.url;
        const response = await got.get(url, { responseType: 'buffer' });
        return response.body;
    }

    // メディアアップロード
    public async uploadMedia(client: TwitterApi, file: DriveFilesRepository): Promise<string> {

        // ファイルデータを取得
        const buffer = await this.getFileBuffer(file);

        // mimeTypeから拡張子を推測
        const type = file.type;

        // アップロード
        const mediaId = await client.v1.uploadMedia(buffer, { mimeType: type });

        return mediaId;
    }

    // 投稿処理
    public async postTweet(user: any, text: string, files: DriveFilesRepository[] = []): Promise<void> {

        const client = await this.getClient(user);
        if (!client) return;

        try {
            let mediaIds: string[] | undefined;
            if (files.length > 0) {
                mediaIds = await Promise.all(files.slice(0, 4).map(f => this.uploadMedia(client, f)));
            }

            // 特定の文字列が付与されている場合、文字列を除去してコミュニティに投稿する
            if (text.includes(this.config.xIntegration.communityKeyword)) {
                const newText = text.replace(this.config.xIntegration.communityKeyword, "");
                await client.v2.tweet({
                    text: newText,
                    media: mediaIds ? { media_ids: mediaIds } : undefined,
                    community_id: this.config.xIntegration.communityid,
                });
            } else {
                await client.v2.tweet({
                    text: text,
                    media: mediaIds ? { media_ids: mediaIds } : undefined,
                });
            }
        } catch (e) {
            console.error(`Failed to post for X: ${e}`);
            return;
        }
    }

}