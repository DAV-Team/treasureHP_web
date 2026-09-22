import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { BadgesModule } from '../badges/badges.module.js';
import { Location, LocationSchema } from '../locations/schemas/location.schema.js';
import { UserProgress, UserProgressSchema } from '../progress/schemas/user-progress.schema.js';
import { QuestSession, QuestSessionSchema } from './schemas/quest-session.schema.js';
import { QuestsController } from './quests.controller.js';
import { QuestsService } from './quests.service.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: QuestSession.name, schema: QuestSessionSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
      { name: Location.name, schema: LocationSchema },
    ]),
    BadgesModule,
  ],
  controllers: [QuestsController],
  providers: [QuestsService],
})
export class QuestsModule {}
