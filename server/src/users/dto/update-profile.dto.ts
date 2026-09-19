import { IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  // An empty string clears the avatar; anything else must be a plain http(s) URL.
  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== '')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: 'avatarUrl must be an http(s) URL' })
  @MaxLength(500)
  avatarUrl?: string;
}
