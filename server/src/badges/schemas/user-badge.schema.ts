import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type UserBadgeDocument = HydratedDocument<UserBadge>;

@Schema({ timestamps: false, collection: 'user_badges' })
export class UserBadge {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Badge', required: true })
  badgeId: Types.ObjectId;

  @Prop({ required: true, default: () => new Date() })
  unlockedAt: Date;
}

export const UserBadgeSchema = SchemaFactory.createForClass(UserBadge);
UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
