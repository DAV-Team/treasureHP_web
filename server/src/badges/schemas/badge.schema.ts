import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { LOCATION_CATEGORIES } from '../../locations/schemas/location.schema.js';
import type { LocationCategory } from '../../locations/schemas/location.schema.js';

export const UNLOCK_CONDITION_TYPES = [
  'locationsInCategory',
  'totalLocations',
  'fullQuestCompleted',
] as const;
export type UnlockConditionType = (typeof UNLOCK_CONDITION_TYPES)[number];

export type BadgeDocument = HydratedDocument<Badge>;

@Schema({ _id: false })
export class UnlockCondition {
  @Prop({ type: String, required: true, enum: UNLOCK_CONDITION_TYPES })
  type: UnlockConditionType;

  @Prop({ type: Number, required: true, min: 0 })
  value: number;

  @Prop({ type: String, enum: LOCATION_CATEGORIES })
  category?: LocationCategory;
}
export const UnlockConditionSchema = SchemaFactory.createForClass(UnlockCondition);

@Schema({ timestamps: true, collection: 'badges' })
export class Badge {
  @Prop({ type: String, required: true, unique: true, trim: true, lowercase: true })
  code: string;

  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, required: true, trim: true })
  description: string;

  @Prop({ type: String, required: true })
  icon: string;

  @Prop({ type: String, required: true })
  colorTheme: string;

  @Prop({ type: UnlockConditionSchema, required: true })
  unlockCondition: UnlockCondition;
}

export const BadgeSchema = SchemaFactory.createForClass(Badge);
