import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Badge, BadgeSchema } from './schemas/badge.schema.js';
import { UserBadge, UserBadgeSchema } from './schemas/user-badge.schema.js';
import { UserProgress, UserProgressSchema } from '../progress/schemas/user-progress.schema.js';
import { QuestSession, QuestSessionSchema } from '../quests/schemas/quest-session.schema.js';
import { Location, LocationSchema } from '../locations/schemas/location.schema.js';
import { BadgesService } from './badges.service.js';
import { BadgesController } from './badges.controller.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: Badge.name, schema: BadgeSchema },
      { name: UserBadge.name, schema: UserBadgeSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: QuestSession.name, schema: QuestSessionSchema },
      { name: Location.name, schema: LocationSchema },
    ]),
  ],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
