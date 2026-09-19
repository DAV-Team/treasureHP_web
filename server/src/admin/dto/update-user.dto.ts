import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { USER_ROLES } from '../../users/schemas/user.schema.js';
import type { UserRole } from '../../users/schemas/user.schema.js';

export class AdminUpdateUserDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsIn(USER_ROLES)
  role?: UserRole;
}
