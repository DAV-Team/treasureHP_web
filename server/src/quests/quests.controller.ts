import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SafeUser } from '../users/interfaces/safe-user.interface.js';
import { StartJourneyDto } from './dto/start-journey.dto.js';
import { QuestsService } from './quests.service.js';

@UseGuards(JwtAuthGuard)
@Controller('quests')
export class QuestsController {
  constructor(private readonly questsService: QuestsService) {}

  @Get('current')
  current(@CurrentUser() user: SafeUser) {
    return this.questsService.getCurrent(user.id);
  }

  @Post('start')
  start(@CurrentUser() user: SafeUser, @Body() dto: StartJourneyDto) {
    return this.questsService.startJourney(user.id, dto.type, dto.locationIds);
  }

  @Post('finish')
  finish(@CurrentUser() user: SafeUser) {
    return this.questsService.finishJourney(user.id);
  }
}
