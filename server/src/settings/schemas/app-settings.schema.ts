import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppSettingsDocument = HydratedDocument<AppSettings>;

/** Site-wide branding every visitor can read. Only one document ever exists (see SettingsService). */
@Schema({ timestamps: true, collection: 'app_settings' })
export class AppSettings {
  @Prop({ type: String })
  logoUrl?: string;
}

export const AppSettingsSchema = SchemaFactory.createForClass(AppSettings);
