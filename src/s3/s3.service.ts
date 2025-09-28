// src/s3/s3.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
    private readonly s3: S3Client;
    private readonly bucketName: string;

    constructor(private readonly configService: ConfigService) {
        const region = this.configService.get<string>('AWS_REGION');
        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
        const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

        // This check ensures the app will fail to start if the required env vars are missing.
        // This is a crucial runtime safeguard.
        if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
            throw new InternalServerErrorException('Missing AWS S3 configuration in environment variables.');
        }

        // Because of the check above, TypeScript now knows these variables are strings.
        this.s3 = new S3Client({
            region: region,
            credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
            },
        });

        this.bucketName = bucketName;
    }

    async uploadImage(file: Express.Multer.File): Promise<{ Location: string; Key: string }> {
        const key = `hoardings/${Date.now()}-${file.originalname}`;
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await this.s3.send(command);
        return {
            Location: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
            Key: key,
        };
    }

    async deleteImage(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });
        await this.s3.send(command);
    }
}