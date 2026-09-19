import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SafeUser } from '../users/interfaces/safe-user.interface.js';
import { AnswerChallengeDto } from './dto/answer-challenge.dto.js';
import { ProgressService } from './progress.service.js';

@UseGuards(JwtAuthGuard)
@Controller('locations/:locationId')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('challenge/answer')
  answer(
    @CurrentUser() user: SafeUser,
    @Param('locationId') locationId: string,
    @Body() dto: AnswerChallengeDto,
  ) {
    return this.progressService.answerQuestion(user.id, locationId, dto.questionOrder, dto.selectedOption);
  }

  @Post('complete')
  complete(@CurrentUser() user: SafeUser, @Param('locationId') locationId: string) {
    return this.progressService.completeLocation(user.id, locationId);
  }
}
