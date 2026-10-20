import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppSettings, AppSettingsDocument } from './schemas/app-settings.schema.js';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(AppSettings.name) private readonly settingsModel: Model<AppSettingsDocument>) {}

  async getPublic() {
    const settings = await this.settingsModel.findOne().lean().exec();
    return { logoUrl: settings?.logoUrl ?? null };
  }

  /** The logo currently stored, if any — read before replacing/clearing it so the old file can be deleted. */
  async currentLogoUrl() {
    const settings = await this.settingsModel.findOne().lean().exec();
    return settings?.logoUrl;
  }

  async setLogo(logoUrl: string) {
    // An empty filter always matches the one settings document there is, so this never creates a duplicate.
    await this.settingsModel.updateOne({}, { $set: { logoUrl } }, { upsert: true }).exec();
    return { logoUrl };
  }

  async clearLogo() {
    await this.settingsModel.updateOne({}, { $unset: { logoUrl: '' } }, { upsert: true }).exec();
    return { logoUrl: null };
  }
}
