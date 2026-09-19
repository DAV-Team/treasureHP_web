import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { OPTION_KEYS } from '../../challenges/schemas/challenge.schema.js';
import type { OptionKey } from '../../challenges/schemas/challenge.schema.js';

export const PROGRESS_STATUSES = ['locked', 'available', 'completed'] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export type UserProgressDocument = HydratedDocument<UserProgress>;

@Schema({ _id: false })
export class AnsweredQuestion {
  @Prop({ required: true, min: 1 })
  questionOrder: number;

  @Prop({ type: String, required: true, enum: OPTION_KEYS })
  selectedOption: OptionKey;

  @Prop({ required: true })
  isCorrect: boolean;

  @Prop({ required: true, default: () => new Date() })
  answeredAt: Date;
}
export const AnsweredQuestionSchema = SchemaFactory.createForClass(AnsweredQuestion);

@Schema({ timestamps: true, collection: 'user_progress' })
export class UserProgress {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Location', required: true })
  locationId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: PROGRESS_STATUSES, default: 'locked' })
  status: ProgressStatus;

  @Prop({ type: [AnsweredQuestionSchema], default: [] })
  answeredQuestions: AnsweredQuestion[];

  @Prop({ default: false })
  cultureStoryUnlocked: boolean;

  @Prop({ default: 0, min: 0 })
  xpEarned: number;

  @Prop()
  completedAt?: Date;
}

export const UserProgressSchema = SchemaFactory.createForClass(UserProgress);
UserProgressSchema.index({ userId: 1, locationId: 1 }, { unique: true });
