import { IsIn, IsInt, Min } from 'class-validator';
import { OPTION_KEYS } from '../../challenges/schemas/challenge.schema.js';
import type { OptionKey } from '../../challenges/schemas/challenge.schema.js';

export class AnswerChallengeDto {
  @IsInt()
  @Min(1)
  questionOrder: number;

  @IsIn(OPTION_KEYS)
  selectedOption: OptionKey;
}
