import { Module } from '@nestjs/common';
import { HoardingsService } from './hoardings.service';
import { HoardingsController } from './hoardings.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Hoarding, HoardingSchema } from './schemas/hoarding.schema';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports:[
    S3Module,
    MongooseModule.forFeature([{name: Hoarding.name, schema: HoardingSchema }])
  ],
  controllers: [HoardingsController],
  providers: [HoardingsService],
})
export class HoardingsModule {}
