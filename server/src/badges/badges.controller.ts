import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SafeUser } from '../users/interfaces/safe-user.interface.js';
import { BadgesService } from './badges.service.js';

@Controller()
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get('badges')
  findAll() {
    return this.badgesService.findForUser('000000000000000000000000');
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/me/badges')
  findMine(@CurrentUser() user: SafeUser) {
    return this.badgesService.findForUser(user.id);
  }
}
