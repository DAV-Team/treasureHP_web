import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Badge, BadgeDocument } from './schemas/badge.schema.js';
import { UserBadge, UserBadgeDocument } from './schemas/user-badge.schema.js';
import { UserProgress, UserProgressDocument } from '../progress/schemas/user-progress.schema.js';
import { QuestSession, QuestSessionDocument } from '../quests/schemas/quest-session.schema.js';
import { Location, LocationDocument } from '../locations/schemas/location.schema.js';

@Injectable()
export class BadgesService {
  constructor(
    @InjectModel(Badge.name) private readonly badgeModel: Model<BadgeDocument>,
    @InjectModel(UserBadge.name) private readonly userBadgeModel: Model<UserBadgeDocument>,
    @InjectModel(UserProgress.name) private readonly progressModel: Model<UserProgressDocument>,
    @InjectModel(QuestSession.name) private readonly sessionModel: Model<QuestSessionDocument>,
    @InjectModel(Location.name) private readonly locationModel: Model<LocationDocument>,
  ) {}

  async findForUser(userId: string) {
    const [badges, unlocked] = await Promise.all([
      this.badgeModel.find().sort({ name: 1 }).lean().exec(),
      this.userBadgeModel.find({ userId: new Types.ObjectId(userId) }).lean().exec(),
    ]);
    const unlockedAtByBadgeId = new Map(unlocked.map((entry) => [entry.badgeId.toString(), entry.unlockedAt]));
    return badges.map((badge) => ({
      ...badge,
      unlocked: unlockedAtByBadgeId.has(badge._id.toString()),
      unlockedAt: unlockedAtByBadgeId.get(badge._id.toString()),
    }));
  }

  async evaluateForUser(userId: string): Promise<void> {
    const [badges, completedProgress, completedSessions] = await Promise.all([
      this.badgeModel.find().exec(),
      this.progressModel.find({ userId: new Types.ObjectId(userId), status: 'completed' }).lean().exec(),
      this.sessionModel.find({ userId: new Types.ObjectId(userId), status: 'completed', type: 'full' }).lean().exec(),
    ]);
    const locationIds = completedProgress.map((progress) => progress.locationId);
    const locations = locationIds.length
      ? await this.locationModel.find({ _id: { $in: locationIds } }).lean().exec()
      : [];

    for (const badge of badges) {
      const condition = badge.unlockCondition;
      const eligible =
        (condition.type === 'totalLocations' && completedProgress.length >= condition.value) ||
        (condition.type === 'fullQuestCompleted' && completedSessions.length >= condition.value) ||
        (condition.type === 'locationsInCategory' &&
          locations.filter((location) => location.category === condition.category).length >= condition.value);

      if (eligible) {
        await this.userBadgeModel.updateOne(
          { userId: new Types.ObjectId(userId), badgeId: badge._id },
          { $setOnInsert: { userId: new Types.ObjectId(userId), badgeId: badge._id, unlockedAt: new Date() } },
          { upsert: true },
        );
      }
    }
  }
}
