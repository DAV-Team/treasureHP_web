import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export const QUEST_SESSION_TYPES = ['full', 'mini', 'explore'] as const;
export type QuestSessionType = (typeof QUEST_SESSION_TYPES)[number];

export const QUEST_SESSION_STATUSES = ['in_progress', 'completed'] as const;
export type QuestSessionStatus = (typeof QUEST_SESSION_STATUSES)[number];

export type QuestSessionDocument = HydratedDocument<QuestSession>;

@Schema({ timestamps: false, collection: 'quest_sessions' })
export class QuestSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: QUEST_SESSION_TYPES })
  type: QuestSessionType;

  @Prop({ type: [Types.ObjectId], ref: 'Location', default: [] })
  locationIds: Types.ObjectId[];

  @Prop({ type: String, required: true, enum: QUEST_SESSION_STATUSES, default: 'in_progress' })
  status: QuestSessionStatus;

  @Prop({ required: true, default: () => new Date() })
  startedAt: Date;

  @Prop()
  completedAt?: Date;
}

export const QuestSessionSchema = SchemaFactory.createForClass(QuestSession);
