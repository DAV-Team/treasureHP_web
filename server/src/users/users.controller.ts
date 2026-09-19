import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { SafeUser } from './interfaces/safe-user.interface.js';
import { ProgressService } from '../progress/progress.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: SafeUser): SafeUser {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: SafeUser, @Body() dto: UpdateProfileDto): Promise<SafeUser> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('me/password')
  async changePassword(@CurrentUser() user: SafeUser, @Body() dto: ChangePasswordDto): Promise<void> {
    await this.usersService.changePassword(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/progress')
  getProgress(@CurrentUser() user: SafeUser) {
    return this.progressService.getForUser(user.id);
  }
}
