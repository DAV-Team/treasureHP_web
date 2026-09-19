import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { LocationsService } from './locations.service.js';
import { FindLocationsDto } from './dto/find-locations.dto.js';
import { ChallengesService } from '../challenges/challenges.service.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import type { SafeUser } from '../users/interfaces/safe-user.interface.js';

@Controller('locations')
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly challengesService: ChallengesService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() query: FindLocationsDto, @Req() request: Request & { user?: SafeUser }) {
    return this.locationsService.findAll(query.category, request.user?.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @Req() request: Request & { user?: SafeUser }) {
    return this.locationsService.findOne(id, request.user?.id);
  }

  @Get(':locationId/challenge')
  findChallenge(@Param('locationId') locationId: string) {
    return this.challengesService.findForLocation(locationId);
  }
}
