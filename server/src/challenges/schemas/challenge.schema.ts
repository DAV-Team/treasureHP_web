import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;
export type OptionKey = (typeof OPTION_KEYS)[number];

export type ChallengeDocument = HydratedDocument<Challenge>;

@Schema({ _id: false })
export class HighlightBox {
  @Prop({ type: Number, required: true, min: 0, max: 100 })
  x: number;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  y: number;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  width: number;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  height: number;
}
export const HighlightBoxSchema = SchemaFactory.createForClass(HighlightBox);

@Schema({ _id: false })
export class QuestionOption {
  @Prop({ type: String, required: true, enum: OPTION_KEYS })
  key: OptionKey;

  @Prop({ type: String, required: true, trim: true })
  text: string;
}
export const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);

@Schema({ _id: false })
export class Question {
  @Prop({ type: Number, required: true, min: 1 })
  order: number;

  @Prop({ type: String, required: true })
  imageUrl: string;

  @Prop({ type: HighlightBoxSchema, required: true })
  highlightBox: HighlightBox;

  @Prop({ type: String, required: true, trim: true })
  questionText: string;

  @Prop({ type: [QuestionOptionSchema], required: true })
  options: QuestionOption[];

  @Prop({ type: String, required: true, enum: OPTION_KEYS })
  correctOption: OptionKey;

  @Prop({ type: String, required: true, trim: true })
  hintText: string;
}
export const QuestionSchema = SchemaFactory.createForClass(Question);

@Schema({ timestamps: true, collection: 'challenges' })
export class Challenge {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Location', required: true })
  locationId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  levelName: string;

  @Prop({
    type: [QuestionSchema],
    required: true,
    validate: {
      validator: (questions: Question[]) => questions.length >= 1,
      message: 'challenge must have at least 1 question',
    },
  })
  questions: Question[];

  @Prop({ type: Number, required: true, min: 0 })
  xpReward: number;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);
