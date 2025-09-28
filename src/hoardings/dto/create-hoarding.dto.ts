import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsArray, IsOptional, ArrayMinSize, ArrayMaxSize, IsEnum } from 'class-validator';
import { ConsultationStatus } from '../enums/consultation-status.enum';

export class CreateHoardingDto {
  @ApiProperty({ example: 'Main Road Billboard', description: 'The public name or title of the hoarding.' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ example: 'Near Hitech City Metro Station', description: 'A descriptive address or landmark.' })
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty({ type: [Number], example: [78.384, 17.447], description: 'GPS coordinates as [longitude, latitude].' })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map(Number) : value
  )
  coordinates: [number, number]; // [longitude, latitude]

  @ApiProperty({ example: 40, description: 'Width of the hoarding in feet.' })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  width?: number;

  @ApiProperty({ example: 20, description: 'Height of the hoarding in feet.' })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  height?: number;
  
  @ApiProperty({ example: 19990, description: 'Price of the hoarding.' })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  price: number;

  @ApiProperty({ example: 'Unavailable', description: 'Is Available or Not' })
  @IsString()
  @IsOptional()
  status: string;
  
  @ApiProperty({ 
    enum: ConsultationStatus, 
    example: ConsultationStatus.PENDING, 
    description: 'Consultation status with the owner.' 
  })
  @IsEnum(ConsultationStatus)
  @IsOptional()
  consultationStatus: ConsultationStatus;

  @ApiProperty({ example:'+91 1234567890', description: 'Contact Info of the Owner.' })
  @IsString()
  @IsOptional()
  ownerContactNumber?: string;

  @ApiProperty({ example:'Ravi Babu', description: 'Name of the Owner.' })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiProperty({ example: 'The Hoarding is near the Mall', description: 'The description of surroundings of hoarding and other Meta Data.' })
  @IsString()
  @IsOptional()
  notes: string;
}