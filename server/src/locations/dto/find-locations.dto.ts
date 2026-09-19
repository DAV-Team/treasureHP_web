import { IsIn, IsOptional } from 'class-validator';
import { LOCATION_CATEGORIES } from '../schemas/location.schema.js';
import type { LocationCategory } from '../schemas/location.schema.js';

export class FindLocationsDto {
  @IsOptional()
  @IsIn(LOCATION_CATEGORIES)
  category?: LocationCategory;
}
