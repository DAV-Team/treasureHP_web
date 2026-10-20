import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Error as MongooseError, Model, Types } from 'mongoose';
import { Badge, BadgeDocument } from '../badges/schemas/badge.schema.js';
import { UserBadge, UserBadgeDocument } from '../badges/schemas/user-badge.schema.js';
import { Challenge, ChallengeDocument } from '../challenges/schemas/challenge.schema.js';
import { Location, LocationDocument } from '../locations/schemas/location.schema.js';
import { UserProgress, UserProgressDocument } from '../progress/schemas/user-progress.schema.js';
import { SettingsService } from '../settings/settings.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import type { SafeUser } from '../users/interfaces/safe-user.interface.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import type { AdminUpdateUserDto } from './dto/update-user.dto.js';

interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Location.name) private readonly locations: Model<LocationDocument>,
    @InjectModel(Challenge.name) private readonly challenges: Model<ChallengeDocument>,
    @InjectModel(Badge.name) private readonly badges: Model<BadgeDocument>,
    @InjectModel(UserProgress.name) private readonly progress: Model<UserProgressDocument>,
    @InjectModel(UserBadge.name) private readonly userBadges: Model<UserBadgeDocument>,
    private readonly settings: SettingsService,
    private readonly uploads: UploadsService,
  ) {}

  async onModuleInit() {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) return;
    const existing = await this.users.findOne({ email: email.toLowerCase() }).exec();
    if (existing) { if (existing.role !== 'admin') { existing.role = 'admin'; await existing.save(); } return; }
    await this.users.create({ email: email.toLowerCase(), name: 'Culture Quest Admin', passwordHash: await bcrypt.hash(password, 10), role: 'admin' });
  }

  async dashboard() {
    const [users, locations, challenges, badges, progress, completed] = await Promise.all([
      this.users.countDocuments(), this.locations.countDocuments(), this.challenges.countDocuments(), this.badges.countDocuments(), this.progress.countDocuments(), this.progress.countDocuments({ status: 'completed' }),
    ]);
    return { users, locations, challenges, badges, progress, completed };
  }

  async listUsers() { return this.users.find().select('-passwordHash').sort({ createdAt: -1 }).lean().exec(); }
  async listLocations() { return this.locations.find().sort({ name: 1 }).lean().exec(); }
  async listChallenges() { return this.challenges.find().populate('locationId', 'name').lean().exec(); }
  async listBadges() { return this.badges.find().sort({ name: 1 }).lean().exec(); }
  async listProgress() { return this.progress.find().populate('userId', 'name email').populate('locationId', 'name').sort({ updatedAt: -1 }).lean().exec(); }

  async updateUser(actor: SafeUser, id: string, dto: AdminUpdateUserDto) {
    this.assertObjectId(id);
    // An admin demoting themselves could leave the system with nobody able to manage it.
    if (id === actor.id && dto.role !== undefined && dto.role !== actor.role) {
      throw new ForbiddenException('You cannot change your own role');
    }
    const user = await this.users.findByIdAndUpdate(id, dto, { returnDocument: 'after', runValidators: true }).select('-passwordHash').lean().exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteUser(actor: SafeUser, id: string) {
    this.assertObjectId(id);
    if (id === actor.id) throw new ForbiddenException('You cannot delete your own account');
    const user = await this.users.findByIdAndDelete(id).exec();
    if (!user) throw new NotFoundException('User not found');
    const userId = new Types.ObjectId(id);
    await Promise.all([this.progress.deleteMany({ userId }), this.userBadges.deleteMany({ userId })]);
    return { deleted: true };
  }

  async createLocation(data: Record<string, unknown>) { return this.guard(() => this.locations.create(data)); }
  async updateLocation(id: string, data: Record<string, unknown>) { return this.update(this.locations, id, data, 'Location'); }
  async deleteLocation(id: string) {
    const result = await this.remove(this.locations, id, 'Location');
    // A challenge or progress record without its location can never be played or shown.
    const locationId = new Types.ObjectId(id);
    await Promise.all([this.challenges.deleteMany({ locationId }), this.progress.deleteMany({ locationId })]);
    return result;
  }

  async createChallenge(data: Record<string, unknown>) {
    await this.assertValidChallenge(data);
    return this.guard(() => this.challenges.create(data));
  }
  async updateChallenge(id: string, data: Record<string, unknown>) {
    await this.assertValidChallenge(data, id);
    return this.update(this.challenges, id, data, 'Challenge');
  }
  async deleteChallenge(id: string) { return this.remove(this.challenges, id, 'Challenge'); }

  async createBadge(data: Record<string, unknown>) { return this.guard(() => this.badges.create(data)); }
  async updateBadge(id: string, data: Record<string, unknown>) { return this.update(this.badges, id, data, 'Badge'); }
  async deleteBadge(id: string) {
    const result = await this.remove(this.badges, id, 'Badge');
    await this.userBadges.deleteMany({ badgeId: new Types.ObjectId(id) });
    return result;
  }

  async setLogo(file: UploadedImage) {
    const previous = await this.settings.currentLogoUrl();
    const logoUrl = await this.uploads.save(file, 'branding');
    const result = await this.settings.setLogo(logoUrl);
    await this.uploads.remove(previous);
    return result;
  }

  async clearLogo() {
    const previous = await this.settings.currentLogoUrl();
    const result = await this.settings.clearLogo();
    await this.uploads.remove(previous);
    return result;
  }

  private assertObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
  }

  // Mongoose failures are the caller's fault (bad or duplicate data), not server errors.
  private async guard<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof MongooseError.ValidationError) throw new BadRequestException(Object.values(error.errors).map((item) => item.message));
      if (error instanceof MongooseError.CastError) throw new BadRequestException(`Invalid value for ${error.path}`);
      if ((error as { code?: number }).code === 11000) throw new ConflictException('A record with the same slug or code already exists');
      throw error;
    }
  }

  private async assertValidChallenge(data: Record<string, unknown>, challengeId?: string) {
    if (challengeId) this.assertObjectId(challengeId);
    type Option = { key?: string };
    type Question = { order?: number; options?: Option[]; correctOption?: string };
    if (Array.isArray(data.questions)) {
      const orders = new Set<number>();
      for (const question of data.questions as Question[]) {
        const keys = (question.options ?? []).map((option) => option.key);
        if (new Set(keys).size !== keys.length) throw new BadRequestException(`Question ${question.order}: option keys must be unique`);
        if (!keys.includes(question.correctOption)) throw new BadRequestException(`Question ${question.order}: correctOption must be one of its options`);
        if (question.order !== undefined) {
          if (orders.has(question.order)) throw new BadRequestException(`Question order ${question.order} is used twice`);
          orders.add(question.order);
        }
      }
    }
    if (data.locationId === undefined) return;
    if (typeof data.locationId !== 'string' || !Types.ObjectId.isValid(data.locationId)) throw new BadRequestException('Invalid locationId');
    if (!(await this.locations.exists({ _id: data.locationId }))) throw new BadRequestException('Location not found');
    // Progress and answers look a challenge up by location, so there must be exactly one per location.
    const clash = await this.challenges.exists({ locationId: data.locationId, ...(challengeId ? { _id: { $ne: challengeId } } : {}) });
    if (clash) throw new ConflictException('This location already has a challenge');
  }

  private async update(model: Model<any>, id: string, data: Record<string, unknown>, label: string) {
    this.assertObjectId(id);
    const document = await this.guard(() => model.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).exec());
    if (!document) throw new NotFoundException(`${label} not found`);
    return document;
  }

  private async remove(model: Model<any>, id: string, label: string) {
    this.assertObjectId(id);
    const document = await model.findByIdAndDelete(id).exec();
    if (!document) throw new NotFoundException(`${label} not found`);
    return { deleted: true };
  }
}
