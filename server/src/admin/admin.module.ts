import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Badge, BadgeSchema } from '../badges/schemas/badge.schema.js';
import { UserBadge, UserBadgeSchema } from '../badges/schemas/user-badge.schema.js';
import { Challenge, ChallengeSchema } from '../challenges/schemas/challenge.schema.js';
import { Location, LocationSchema } from '../locations/schemas/location.schema.js';
import { UserProgress, UserProgressSchema } from '../progress/schemas/user-progress.schema.js';
import { SettingsModule } from '../settings/settings.module.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { AdminController } from './admin.controller.js';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }, { name: Location.name, schema: LocationSchema }, { name: Challenge.name, schema: ChallengeSchema }, { name: Badge.name, schema: BadgeSchema }, { name: UserProgress.name, schema: UserProgressSchema }, { name: UserBadge.name, schema: UserBadgeSchema },
    ]),
    SettingsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
