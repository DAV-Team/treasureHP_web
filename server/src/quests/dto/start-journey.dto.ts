import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn, IsMongoId } from 'class-validator';
import { JOURNEY_TYPES } from '../quest-sizes.js';
import type { JourneyType } from '../quest-sizes.js';

export class StartJourneyDto {
  @IsIn(JOURNEY_TYPES)
  type: JourneyType;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @IsMongoId({ each: true })
  locationIds: string[];
}
