import { Controller, Get, Param } from '@nestjs/common';
import { ChallengesService } from './challenges.service.js';

@Controller('locations/:locationId/challenge')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  findForLocation(@Param('locationId') locationId: string) {
    return this.challengesService.findForLocation(locationId);
  }
}
