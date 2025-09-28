import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { CreateHoardingDto } from './dto/create-hoarding.dto';
import { UpdateHoardingDto } from './dto/update-hoarding.dto';
import { Hoarding } from './schemas/hoarding.schema';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FindInBetweenDto } from './dto/find-in-between.dto';

@Injectable()
export class HoardingsService {
  private readonly logger = new Logger(HoardingsService.name);

  constructor(
    @InjectModel(Hoarding.name) private readonly hoardingModel: Model<Hoarding>,
    private readonly cloudinaryService: CloudinaryService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(
    createHoardingDto: CreateHoardingDto,
    image: Express.Multer.File,
  ): Promise<Hoarding> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const finalDto = { ...createHoardingDto };
      
      this.logger.log('Uploading the image to Cloudinary and fetching the Image URL');

      const uploadResult = await this.cloudinaryService.uploadImage(image);
      if (!uploadResult.secure_url) {
        throw new InternalServerErrorException('Image upload failed.');
      }

      const newHoarding = new this.hoardingModel({
        ...finalDto,
        imageUrl: uploadResult.secure_url,
        location: {
          type: 'Point',
          coordinates: finalDto.coordinates,
        },
      });

      const savedHoarding = await newHoarding.save({ session });
      await session.commitTransaction();
      this.logger.log(`Successfully created hoarding with ID: ${savedHoarding._id}`);
      return savedHoarding;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Transaction failed for hoarding creation.`, error.stack);
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Could not create hoarding.');
    } finally {
      session.endSession();
    }
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
    const { source, destination } = findInBetweenDto;
    const [ lon1, lat1 ] = source;
    const [ lon2, lat2 ] = destination;

    // Calculate the midpoint
    const midLon = (lon1 + lon2) / 2;
    const midLat = (lat1 + lat2) / 2;

    const radiusInKm = 15; // 15km proximity

    return this.hoardingModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [midLon, midLat],
          },
          $maxDistance: radiusInKm * 1000, // convert km to meters
        },
      },
    });
  }


  async update(
    id: string,
    updateHoardingDto: UpdateHoardingDto,
    image?: Express.Multer.File,
  ): Promise<Hoarding> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const hoarding = await this.hoardingModel.findById(id).session(session);
      if (!hoarding) throw new NotFoundException(`Hoarding with ID "${id}" not found`);

      const updatePayload: Partial<Hoarding> = { ...updateHoardingDto };

      if (image) {
        if (hoarding.imageUrl) {
          const urlParts = hoarding.imageUrl.split('/');
          const lastPart = urlParts.pop();
          if (lastPart) {
            const publicId = lastPart.split('.')[0];
            await this.cloudinaryService.deleteImage(`hoardings/${publicId}`);
          }
        }
        const uploadResult = await this.cloudinaryService.uploadImage(image);
        if (!uploadResult.secure_url) throw new InternalServerErrorException('Image upload failed.');
        
        updatePayload.imageUrl = uploadResult.secure_url;
      }

      const updatedHoarding = await this.hoardingModel.findByIdAndUpdate(
        id,
        updatePayload,
        { new: true, session },
      );
      if (!updatedHoarding) throw new NotFoundException(`Hoarding with ID "${id}" not found during update`);

      await session.commitTransaction();
      return updatedHoarding;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Transaction failed for hoarding update.`, error.stack);
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

      if (hoarding.imageUrl) {
        const urlParts = hoarding.imageUrl.split('/');
        const lastPart = urlParts.pop();
        if (lastPart) {
          const publicId = lastPart.split('.')[0];
          await this.cloudinaryService.deleteImage(`hoardings/${publicId}`);
        }
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