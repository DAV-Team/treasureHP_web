import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service.js';

// Public: every visitor, signed in or not, needs the site branding.
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getPublic() {
    return this.settingsService.getPublic();
  }
}
