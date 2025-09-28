import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { GeoJsonType } from '../dto/geojson-type.enum';
import { ConsultationStatus } from '../enums/consultation-status.enum';

@Schema({ _id: false })
class Location {
  @Prop({ type: String, enum: Object.values(GeoJsonType), default: GeoJsonType.Point })
  type: GeoJsonType;

  @Prop({ type: [Number], required: true })
  coordinates: number[]; // [longitude, latitude]
}

@Schema({ timestamps: true })
export class Hoarding extends Document {
  @Prop()
  name: string;

  @Prop()
  address: string;

  @Prop({ type: Location, required: true })
  location: Location;

  @Prop()
  width: number;

  @Prop()
  height: number;

  @Prop({ default: 'Unavailable' })
  status: string;

  @Prop({ 
    type: String, 
    enum: Object.values(ConsultationStatus), 
    default: ConsultationStatus.PENDING 
  })
  consultationStatus: ConsultationStatus;

  @Prop()
  price: number;

  @Prop()
  ownerContactNumber: string;

  @Prop()
  ownerName: string;

  @Prop()
  imageUrl: string; 

  @Prop()
  notes?: string;
}

export const HoardingSchema = SchemaFactory.createForClass(Hoarding);

// Create a 2dsphere index for geospatial queries
HoardingSchema.index({ location: '2dsphere' });