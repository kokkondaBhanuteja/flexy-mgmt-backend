import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Logger } from 'winston';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { CreateHoardingDto } from './dto/create-hoarding.dto';
import { UpdateHoardingDto } from './dto/update-hoarding.dto';
import { Hoarding } from './schemas/hoarding.schema';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FindInBetweenDto } from './dto/find-in-between.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { S3Service } from 'src/s3/s3.service';
import { GeoJsonType } from './dto/geojson-type.enum';
type UpdatePayload = Partial<Hoarding> & { coordinates?: [number, number] };

@Injectable()
export class HoardingsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectModel(Hoarding.name) private readonly hoardingModel: Model<Hoarding>,
    private readonly s3Service: S3Service, // Inject S3Service
    @InjectConnection() private readonly connection: Connection,
  ) { }
  async create(
    createHoardingDto: CreateHoardingDto,
    image: Express.Multer.File,
  ): Promise<Hoarding> {
    const context = 'HoardingsService';
    const session = await this.connection.startSession();
    this.logger.info('START: Mongoose session started.', context);

    session.startTransaction();
    this.logger.info('STEP 1: Transaction initiated.', context);

    try {
      const finalDto = { ...createHoardingDto };

      this.logger.info('STEP 2: Attempting image upload to S3.', context);

      // --- CHANGE FOR S3 ---
      const uploadResult = await this.s3Service.uploadImage(image);

      this.logger.info(`STEP 3: S3 upload successful. Key: ${uploadResult.Key}`, context);

      if (!uploadResult.Location) {
        throw new InternalServerErrorException('Image upload failed.');
      }

      const newHoarding = new this.hoardingModel({
        ...finalDto,
        // --- CHANGE FOR S3 ---
        imageUrl: uploadResult.Location, // Use Location for the full URL
        publicId: uploadResult.Key,      // Use Key for the object identifier
        location: {
          type: 'Point',
          coordinates: finalDto.coordinates,
        },
      });

      this.logger.info('STEP 4: Saving new hoarding document to MongoDB.', context);

      const savedHoarding = await newHoarding.save({ session });

      this.logger.info('STEP 5: Document saved. Committing transaction.', context);

      await session.commitTransaction();
      this.logger.info(`END: Transaction committed successfully for ID: ${savedHoarding._id}`, context);
      return savedHoarding;
    } catch (error) {
      await session.abortTransaction();
      console.error("DEBUG - FULL TRANSACTION ERROR DETAILS:", error);
      this.logger.error(`Transaction failed for hoarding creation.`, error.stack, context);

      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Could not create hoarding.');
    } finally {
      session.endSession();
      this.logger.info('FINAL: Mongoose session ended.', context);
    }
  }

  async fetchAllLocations(){
    const data = await this.hoardingModel.find().exec();
    if (!data) {
      throw new NotFoundException(`Hoardings not found`);
    }
    return data; 
  }
  
  async findAll(search?: string, page: number = 1, limit: number = 5): Promise<{ data: Hoarding[], total: number }> {
    const query = {};
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query['$or'] = [
        { name: searchRegex },
        { ownerName: searchRegex },
        { address: searchRegex },
        { status: searchRegex },
        { consultationStatus: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.hoardingModel.find(query).skip(skip).limit(limit).exec(),
      this.hoardingModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<Hoarding> {
    const hoarding = await this.hoardingModel.findById(id).exec();
    if (!hoarding) {
      throw new NotFoundException(`Hoarding with ID "${id}" not found`);
    }
    return hoarding;
  }

  async findInBetween(findInBetweenDto: FindInBetweenDto): Promise<Hoarding[]> {
    const { source, destination, radius = 2 } = findInBetweenDto;
    const [lon1, lat1] = source;
    const [lon2, lat2] = destination;

    // Calculate the midpoint
    const midLon = (lon1 + lon2) / 2;
    const midLat = (lat1 + lat2) / 2;

    // const radiusInKm = 15; // 15km proximity

    return this.hoardingModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [midLon, midLat],
          },
          $maxDistance: radius * 1000, // convert km to meters
        },
      },
    });
  }


 async update(
    id: string,
    updateHoardingDto: UpdateHoardingDto,
    image?: Express.Multer.File,
  ): Promise<Hoarding> {
    const context = `HoardingsService - update(id: ${id})`;
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const hoarding = await this.hoardingModel.findById(id).session(session);
      if (!hoarding) {
        throw new NotFoundException(`Hoarding with ID "${id}" not found`);
      }

      // --- THE FIX: Build the payload object step-by-step ---
      // Start with the properties from the DTO. This is type-safe.
      const updatePayload: UpdatePayload = { ...updateHoardingDto };

      // 1. Handle Location Transformation
      if (updateHoardingDto.coordinates) {
        this.logger.info('New coordinates provided. Transforming to location object.', { context });
        updatePayload.location = {
          type: GeoJsonType.Point,
          coordinates: updateHoardingDto.coordinates,
        };
        // Remove the original 'coordinates' property to keep the payload clean.
        delete updatePayload.coordinates;
      }

      // 2. Handle Image Upload
      if (image) {
        this.logger.info('New image provided. Processing upload.', { context });
        if (hoarding.publicId) {
          await this.s3Service.deleteImage(hoarding.publicId);
        }
        const uploadResult = await this.s3Service.uploadImage(image);
        if (!uploadResult.Location) {
          throw new InternalServerErrorException('Image upload failed.');
        }
        // Add the new image properties to the payload.
        updatePayload.imageUrl = uploadResult.Location;
        updatePayload.publicId = uploadResult.Key;
      }
      // --- END OF FIX ---

      const updatedHoarding = await this.hoardingModel.findByIdAndUpdate(
        id,
        { $set: updatePayload }, // Use $set for a more robust update
        { new: true, session },
      );
      if (!updatedHoarding) {
        throw new NotFoundException(`Hoarding with ID "${id}" not found during update`);
      }

      await session.commitTransaction();
      this.logger.info(`Transaction committed successfully.`, { context });
      return updatedHoarding;

    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Transaction failed and was aborted.`, { error: error.stack, context });
      throw new InternalServerErrorException('Could not update hoarding.');

    } finally {
      session.endSession();
    }
  }

  async remove(id: string): Promise<Hoarding> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const hoarding = await this.hoardingModel.findById(id).session(session);
      if (!hoarding) throw new NotFoundException(`Hoarding with ID "${id}" not found`);

      if (hoarding.publicId) {
        // The publicId is now the S3 Key
        await this.s3Service.deleteImage(hoarding.publicId);
      }

      const deletedHoarding = await this.hoardingModel.findByIdAndDelete(id, { session });
      if (!deletedHoarding) throw new NotFoundException(`Hoarding with ID "${id}" not found during deletion`);

      await session.commitTransaction();
      return deletedHoarding;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Transaction failed for hoarding removal.`, error.stack);
      throw new InternalServerErrorException('Could not remove hoarding.');
    } finally {
      session.endSession();
    }
  }
}