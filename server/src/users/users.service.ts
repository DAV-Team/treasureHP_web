import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';
import type { UserRole } from './schemas/user.schema.js';
import { SafeUser } from './interfaces/safe-user.interface.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import { SALT_ROUNDS } from './password.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel.findById(id).exec();
  }

  async create(data: { email: string; passwordHash: string; name: string; role?: UserRole }): Promise<UserDocument> {
    const created = new this.userModel(data);
    return created.save();
  }

  async getSafeUserOrThrow(id: string): Promise<SafeUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toSafeUser(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<SafeUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl === '' ? undefined : dto.avatarUrl;
    }
    await user.save();
    return this.toSafeUser(user);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // 401 would look like an expired session to the client, so a wrong current password is a 400.
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must differ from the current password');
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await user.save();
  }

  toSafeUser(user: UserDocument): SafeUser {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      level: user.level,
      totalXp: user.totalXp,
      role: user.role,
    };
  }
}
