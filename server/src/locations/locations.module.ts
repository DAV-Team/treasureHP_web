import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Location, LocationSchema } from './schemas/location.schema.js';
import { UserProgress, UserProgressSchema } from '../progress/schemas/user-progress.schema.js';
import { ChallengesModule } from '../challenges/challenges.module.js';
import { LocationsService } from './locations.service.js';
import { LocationsController } from './locations.controller.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: Location.name, schema: LocationSchema },
      { name: UserProgress.name, schema: UserProgressSchema },
    ]),
    ChallengesModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
