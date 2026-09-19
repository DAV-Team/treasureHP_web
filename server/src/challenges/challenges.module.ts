import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Challenge, ChallengeSchema } from './schemas/challenge.schema.js';
import { ChallengesService } from './challenges.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Challenge.name, schema: ChallengeSchema }])],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
