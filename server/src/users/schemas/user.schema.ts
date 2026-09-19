import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;
export const USER_ROLES = ['player', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: String, required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String })
  avatarUrl?: string;

  @Prop({ type: Number, default: 1, min: 1 })
  level: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalXp: number;

  @Prop({ type: String, enum: USER_ROLES, default: 'player' })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
