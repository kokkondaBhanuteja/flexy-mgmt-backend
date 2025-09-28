import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
    private readonly s3: S3Client;
    private readonly bucketName: string;

    constructor(private readonly configService: ConfigService) {
        this.s3 = new S3Client({
            region: this.configService.get<string>('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
            },
        });
        this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    }

    async uploadImage(file: Express.Multer.File): Promise<{ Location: string; Key: string }> {
        const key = `hoardings/${Date.now()}-${file.originalname}`;
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
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