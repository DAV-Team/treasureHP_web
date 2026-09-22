import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BadgesService } from '../badges/badges.service.js';
import { Location, LocationDocument } from '../locations/schemas/location.schema.js';
import { UserProgress, UserProgressDocument } from '../progress/schemas/user-progress.schema.js';
import { QUEST_SIZES } from './quest-sizes.js';
import type { JourneyType } from './quest-sizes.js';
import { QuestSession, QuestSessionDocument } from './schemas/quest-session.schema.js';

@Injectable()
export class QuestsService {
  constructor(
    @InjectModel(QuestSession.name) private readonly sessionModel: Model<QuestSessionDocument>,
    @InjectModel(UserProgress.name) private readonly progressModel: Model<UserProgressDocument>,
    @InjectModel(Location.name) private readonly locationModel: Model<LocationDocument>,
    private readonly badgesService: BadgesService,
  ) {}

  async getCurrent(userId: string) {
    const session = await this.findActive(userId);
    return { journey: session ? this.toView(session) : null };
  }

  /** Starts a journey of exactly the required number of distinct locations, replacing any unfinished one. */
  async startJourney(userId: string, type: JourneyType, locationIds: string[]) {
    const required = Math.min(QUEST_SIZES[type], await this.locationModel.countDocuments().exec());
    const unique = [...new Set(locationIds)];
    if (unique.length !== locationIds.length || unique.length !== required) {
      throw new BadRequestException(`Choose exactly ${required} different locations`);
    }
    const objectIds = unique.map((id) => new Types.ObjectId(id));
    if ((await this.locationModel.countDocuments({ _id: { $in: objectIds } }).exec()) !== required) {
      throw new BadRequestException('Unknown location in journey');
    }

    const objectUserId = new Types.ObjectId(userId);
    await this.sessionModel.deleteMany({ userId: objectUserId, status: 'in_progress' }).exec();
    const session = await this.sessionModel.create({ userId: objectUserId, type, locationIds: objectIds, status: 'in_progress' });
    return { journey: this.toView(session) };
  }

  /**
   * Closes the player's current journey, then clears per-location progress so a fresh journey can start.
   * XP and unlocked badges are kept. Without an explicit journey (e.g. free exploring) the journey is every location.
   */
  async finishJourney(userId: string) {
    const objectUserId = new Types.ObjectId(userId);
    const [active, allLocations, progress] = await Promise.all([
      this.findActive(userId),
      this.locationModel.find({}, { _id: 1 }).lean().exec(),
      this.progressModel.find({ userId: objectUserId }).lean().exec(),
    ]);
    const journeyIds = active ? active.locationIds : allLocations.map((location) => location._id);
    const completed = progress.filter((entry) => entry.status === 'completed');
    const completedIds = new Set(completed.map((entry) => entry.locationId.toString()));
    if (journeyIds.length === 0 || journeyIds.some((id) => !completedIds.has(id.toString()))) {
      throw new BadRequestException('Complete every location before finishing the journey');
    }

    // Deleting first makes a double submit lose the race instead of recording the journey twice.
    const deleted = await this.progressModel
      .deleteMany({ _id: { $in: progress.map((entry) => entry._id) } })
      .exec();
    if (deleted.deletedCount !== progress.length) {
      throw new ConflictException('Journey was already finished');
    }

    const completedAt = new Date();
    const type = active?.type ?? 'full';
    if (active) {
      await this.sessionModel.updateOne({ _id: active._id }, { $set: { status: 'completed', completedAt } }).exec();
    } else {
      const startedAt = completed.reduce(
        (earliest, entry) => (entry.completedAt && entry.completedAt < earliest ? entry.completedAt : earliest),
        completedAt,
      );
      await this.sessionModel.create({ userId: objectUserId, type, locationIds: journeyIds, status: 'completed', startedAt, completedAt });
    }
    await this.badgesService.evaluateForUser(userId);

    return { finished: true, type, locationsCompleted: journeyIds.length };
  }

  private findActive(userId: string) {
    return this.sessionModel
      .findOne({ userId: new Types.ObjectId(userId), status: 'in_progress' })
      .sort({ startedAt: -1 })
      .lean()
      .exec();
  }

  private toView(session: { _id: Types.ObjectId; type: string; locationIds: Types.ObjectId[]; startedAt: Date }) {
    return {
      id: session._id.toString(),
      type: session.type,
      locationIds: session.locationIds.map((id) => id.toString()),
      startedAt: session.startedAt,
    };
  }
}
