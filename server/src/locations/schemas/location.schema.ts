import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const LOCATION_CATEGORIES = [
  'history',
  'culture',
  'cuisine',
  'architecture',
  'art',
] as const;

export type LocationCategory = (typeof LOCATION_CATEGORIES)[number];

export type LocationDocument = HydratedDocument<Location>;

@Schema({ _id: false })
export class Coordinates {
  @Prop({ type: Number, required: true, min: -90, max: 90 })
  lat: number;

  @Prop({ type: Number, required: true, min: -180, max: 180 })
  lng: number;
}
export const CoordinatesSchema = SchemaFactory.createForClass(Coordinates);

@Schema({ _id: false })
export class CultureStory {
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String })
  imageUrl?: string;
}
export const CultureStorySchema = SchemaFactory.createForClass(CultureStory);

@Schema({ timestamps: true, collection: 'locations' })
export class Location {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, required: true, unique: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ type: String, required: true, trim: true })
  address: string;

  @Prop({ type: String, required: true, enum: LOCATION_CATEGORIES })
  category: LocationCategory;

  @Prop({ type: CoordinatesSchema, required: true })
  coordinates: Coordinates;

  @Prop({ type: String, required: true })
  coverImageUrl: string;

  @Prop({ type: String, required: true })
  shortDescription: string;

  @Prop({ type: CultureStorySchema, required: true })
  cultureStory: CultureStory;

  @Prop({ type: Number, required: true, min: 0 })
  xpReward: number;

  @Prop({ type: Boolean, default: false })
  isSpecialQuest: boolean;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
