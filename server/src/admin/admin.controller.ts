import { Body, Controller, Delete, Get, HttpStatus, Param, ParseFilePipeBuilder, Patch, Post, SetMetadata, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SafeUser } from '../users/interfaces/safe-user.interface.js';
import { AdminGuard, ADMIN_ONLY } from './admin.guard.js';
import { AdminUpdateUserDto } from './dto/update-user.dto.js';
import { AdminService } from './admin.service.js';

const maxLogoBytes = 3 * 1024 * 1024;
const logoFileInterceptor = FileInterceptor('logo', { storage: memoryStorage(), limits: { fileSize: maxLogoBytes } });
const logoFileValidation = new ParseFilePipeBuilder()
  .addFileTypeValidator({ fileType: /^image\/(png|jpe?g|webp|svg\+xml)$/, skipMagicNumbersValidation: true })
  .addMaxSizeValidator({ maxSize: maxLogoBytes })
  .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST });

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

  @Post('settings/logo')
  @UseInterceptors(logoFileInterceptor)
  setLogo(@UploadedFile(logoFileValidation) file: Express.Multer.File) {
    return this.admin.setLogo(file);
  }

  @Delete('settings/logo') clearLogo() { return this.admin.clearLogo(); }

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
