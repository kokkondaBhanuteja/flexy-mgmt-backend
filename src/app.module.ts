import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HoardingsModule } from './hoardings/hoardings.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer'; // Import MailerModule
import { MailController } from './mail.controller';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger/winston.config';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    // Add MailerModule configuration
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          port: configService.get<number>('EMAIL_PORT'),
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get<string>('EMAIL_USER'), 
            pass: configService.get<string>('EMAIL_PASSWORD'),
          },
        },
        defaults: {
          from: '"No Reply" tonystalk989@gmail.com',
        },
      }),
      inject: [ConfigService],
    }),
    HoardingsModule,
    S3Module,
  ],
  controllers: [AppController, MailController],
  providers: [AppService],
})
export class AppModule {}