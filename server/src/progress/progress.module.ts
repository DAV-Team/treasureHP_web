import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Challenge, ChallengeSchema } from '../challenges/schemas/challenge.schema.js';
import { Location, LocationSchema } from '../locations/schemas/location.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { BadgesModule } from '../badges/badges.module.js';
import { UserProgress, UserProgressSchema } from './schemas/user-progress.schema.js';
import { ProgressService } from './progress.service.js';
import { ProgressController } from './progress.controller.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Location.name, schema: LocationSchema },
      { name: User.name, schema: UserSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
    ]),
    BadgesModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
