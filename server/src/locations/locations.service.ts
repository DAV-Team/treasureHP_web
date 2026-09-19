import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema.js';
import { UserProgress, UserProgressDocument } from '../progress/schemas/user-progress.schema.js';
import { LocationCategory } from './schemas/location.schema.js';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name) private readonly locationModel: Model<LocationDocument>,
    @InjectModel(UserProgress.name) private readonly progressModel: Model<UserProgressDocument>,
  ) {}

  async findAll(category?: LocationCategory, userId?: string) {
    const filter = category ? { category } : {};
    const locations = await this.locationModel.find(filter).sort({ name: 1 }).lean().exec();
    const progressByLocation = new Map<string, { status: string; cultureStoryUnlocked: boolean }>();
    if (userId && Types.ObjectId.isValid(userId)) {
      const progress = await this.progressModel
        .find({ userId: new Types.ObjectId(userId), locationId: { $in: locations.map((location) => location._id) } })
        .lean()
        .exec();
      for (const item of progress) {
        progressByLocation.set(item.locationId.toString(), { status: item.status, cultureStoryUnlocked: item.cultureStoryUnlocked });
      }
    }
    return locations.map((location) => ({
      ...location,
      // The story text stays behind the challenge; only GET /locations/:id may reveal it once unlocked.
      cultureStory: { title: location.cultureStory.title, imageUrl: location.cultureStory.imageUrl, locked: true },
      // Only signed-in callers get progress; guests see the plain catalogue.
      ...(userId ? { progress: progressByLocation.get(location._id.toString()) ?? { status: 'available', cultureStoryUnlocked: false } } : {}),
    }));
  }

  async findOne(id: string, userId?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid location id');
    }
    const location = await this.locationModel.findById(id).lean().exec();
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const progress = userId && Types.ObjectId.isValid(userId)
      ? await this.progressModel
          .findOne({ userId: new Types.ObjectId(userId), locationId: new Types.ObjectId(id) })
          .lean()
          .exec()
      : null;
    const cultureStoryUnlocked = progress?.cultureStoryUnlocked ?? false;

    return {
      ...location,
      cultureStory: cultureStoryUnlocked
        ? location.cultureStory
        : { title: location.cultureStory.title, imageUrl: location.cultureStory.imageUrl, locked: true },
      progress: {
        status: progress?.status ?? 'available',
        cultureStoryUnlocked,
      },
    };
  }
}
