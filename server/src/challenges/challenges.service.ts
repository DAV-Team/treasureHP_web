import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Challenge, ChallengeDocument } from './schemas/challenge.schema.js';

@Injectable()
export class ChallengesService {
  constructor(@InjectModel(Challenge.name) private readonly challengeModel: Model<ChallengeDocument>) {}

  async findForLocation(locationId: string) {
    if (!Types.ObjectId.isValid(locationId)) {
      throw new BadRequestException('Invalid location id');
    }
    const challenge = await this.challengeModel
      .findOne({ locationId: new Types.ObjectId(locationId) })
      .lean()
      .exec();
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return {
      id: challenge._id.toString(),
      locationId: challenge.locationId.toString(),
      levelName: challenge.levelName,
      xpReward: challenge.xpReward,
      questions: challenge.questions.map(({ correctOption: _correctOption, ...question }) => question),
    };
  }
}
