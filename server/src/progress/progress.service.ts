import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Challenge, ChallengeDocument } from '../challenges/schemas/challenge.schema.js';
import type { OptionKey } from '../challenges/schemas/challenge.schema.js';
import { Location, LocationDocument } from '../locations/schemas/location.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { calculateLevel } from '../users/level.js';
import { UserProgress, UserProgressDocument } from './schemas/user-progress.schema.js';
import { BadgesService } from '../badges/badges.service.js';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Challenge.name) private readonly challengeModel: Model<ChallengeDocument>,
    @InjectModel(Location.name) private readonly locationModel: Model<LocationDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserProgress.name) private readonly progressModel: Model<UserProgressDocument>,
    private readonly badgesService: BadgesService,
  ) {}

  async answerQuestion(userId: string, locationId: string, questionOrder: number, selectedOption: OptionKey) {
    const objectLocationId = this.toObjectId(locationId);
    const challenge = await this.challengeModel.findOne({ locationId: objectLocationId }).lean().exec();
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }
    const question = challenge.questions.find((entry) => entry.order === questionOrder);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const isCorrect = question.correctOption === selectedOption;
    const progressFilter = { userId: new Types.ObjectId(userId), locationId: objectLocationId };
    await this.progressModel.updateOne(
      progressFilter,
      {
        $set: { status: 'available' },
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          locationId: objectLocationId,
          answeredQuestions: [],
        },
      },
      { upsert: true },
    ).exec();

    const answer = { questionOrder, selectedOption, isCorrect, answeredAt: new Date() };
    const existingAnswer = await this.progressModel.updateOne(
      { ...progressFilter, 'answeredQuestions.questionOrder': questionOrder },
      { $set: { 'answeredQuestions.$': answer } },
    ).exec();
    if (existingAnswer.modifiedCount === 0) {
      await this.progressModel.updateOne(
        { ...progressFilter, 'answeredQuestions.questionOrder': { $ne: questionOrder } },
        { $push: { answeredQuestions: answer } },
      ).exec();
    }

    return { questionOrder, isCorrect, hintText: isCorrect ? undefined : question.hintText };
  }

  async getForUser(userId: string) {
    return this.progressModel.find({ userId: new Types.ObjectId(userId) }).lean().exec();
  }

  async completeLocation(userId: string, locationId: string) {
    const objectLocationId = this.toObjectId(locationId);
    const [challenge, location, progress] = await Promise.all([
      this.challengeModel.findOne({ locationId: objectLocationId }).lean().exec(),
      this.locationModel.findById(objectLocationId).lean().exec(),
      this.progressModel.findOne({ userId: new Types.ObjectId(userId), locationId: objectLocationId }).lean().exec(),
    ]);
    if (!challenge || !location) {
      throw new NotFoundException('Location challenge not found');
    }
    const allAnsweredCorrectly = challenge.questions.every((question) =>
      progress?.answeredQuestions.some((answer) => answer.questionOrder === question.order && answer.isCorrect),
    );
    if (!allAnsweredCorrectly) {
      throw new BadRequestException('All questions must be answered correctly before completion');
    }

    const completed = await this.progressModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        locationId: objectLocationId,
        status: { $ne: 'completed' },
      },
      {
        $set: {
          status: 'completed',
          cultureStoryUnlocked: true,
          xpEarned: challenge.xpReward,
          completedAt: new Date(),
        },
      },
      { new: true },
    ).exec();

    if (completed) {
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        { $inc: { totalXp: challenge.xpReward } },
        { new: true },
      ).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.level = calculateLevel(user.totalXp);
      await user.save();
      await this.badgesService.evaluateForUser(userId);
      return { completed: true, xpEarned: challenge.xpReward, totalXp: user.totalXp, level: user.level };
    }

    const user = await this.userModel.findById(userId).lean().exec();
    return { completed: false, xpEarned: 0, totalXp: user?.totalXp ?? 0, level: user?.level ?? 1 };
  }

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid location id');
    }
    return new Types.ObjectId(id);
  }
}
