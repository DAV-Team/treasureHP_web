import { IsUrl, MaxLength, ValidateIf } from 'class-validator';

export class UpdateLogoDto {
  // An empty string clears the logo (falls back to the default mark); anything else must be a plain http(s) URL.
  @ValidateIf((_object, value: unknown) => value !== '')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: 'logoUrl must be an http(s) URL' })
  @MaxLength(500)
  logoUrl: string;
}
