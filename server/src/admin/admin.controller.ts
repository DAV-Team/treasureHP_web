import { Body, Controller, Delete, Get, Param, Patch, Post, SetMetadata, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SafeUser } from '../users/interfaces/safe-user.interface.js';
import { AdminGuard, ADMIN_ONLY } from './admin.guard.js';
import { AdminUpdateUserDto } from './dto/update-user.dto.js';
import { AdminService } from './admin.service.js';

@UseGuards(AdminGuard)
@SetMetadata(ADMIN_ONLY, true)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard') dashboard() { return this.admin.dashboard(); }
  @Get('users') users() { return this.admin.listUsers(); }
  @Get('locations') locations() { return this.admin.listLocations(); }
  @Get('challenges') challenges() { return this.admin.listChallenges(); }
  @Get('badges') badges() { return this.admin.listBadges(); }
  @Get('progress') progress() { return this.admin.listProgress(); }

  @Patch('users/:id') updateUser(@CurrentUser() actor: SafeUser, @Param('id') id: string, @Body() dto: AdminUpdateUserDto) { return this.admin.updateUser(actor, id, dto); }
  @Delete('users/:id') deleteUser(@CurrentUser() actor: SafeUser, @Param('id') id: string) { return this.admin.deleteUser(actor, id); }

  @Post('locations') createLocation(@Body() data: Record<string, unknown>) { return this.admin.createLocation(data); }
  @Patch('locations/:id') updateLocation(@Param('id') id: string, @Body() data: Record<string, unknown>) { return this.admin.updateLocation(id, data); }
  @Delete('locations/:id') deleteLocation(@Param('id') id: string) { return this.admin.deleteLocation(id); }

  @Post('challenges') createChallenge(@Body() data: Record<string, unknown>) { return this.admin.createChallenge(data); }
  @Patch('challenges/:id') updateChallenge(@Param('id') id: string, @Body() data: Record<string, unknown>) { return this.admin.updateChallenge(id, data); }
  @Delete('challenges/:id') deleteChallenge(@Param('id') id: string) { return this.admin.deleteChallenge(id); }

  @Post('badges') createBadge(@Body() data: Record<string, unknown>) { return this.admin.createBadge(data); }
  @Patch('badges/:id') updateBadge(@Param('id') id: string, @Body() data: Record<string, unknown>) { return this.admin.updateBadge(id, data); }
  @Delete('badges/:id') deleteBadge(@Param('id') id: string) { return this.admin.deleteBadge(id); }
}
