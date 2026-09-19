import mongoose, { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { ChallengeSchema } from './challenge.schema.js';

const ChallengeModel = mongoose.model('ChallengeSchemaSpec', ChallengeSchema);

const validQuestion = {
  order: 1,
  imageUrl: '/images/q1.jpg',
  highlightBox: { x: 10, y: 10, width: 20, height: 20 },
  questionText: 'Câu hỏi mẫu?',
  options: [
    { key: 'A', text: 'Đáp án A' },
    { key: 'B', text: 'Đáp án B' },
    { key: 'C', text: 'Đáp án C' },
    { key: 'D', text: 'Đáp án D' },
  ],
  correctOption: 'B',
  hintText: 'Gợi ý mẫu',
};

const validChallenge = {
  locationId: new Types.ObjectId(),
  levelName: 'The Hidden Detail',
  questions: [validQuestion],
  xpReward: 50,
};

describe('Challenge schema', () => {
  it('accepts a fully valid document', () => {
    const doc = new ChallengeModel(validChallenge);
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it('rejects a document missing locationId', () => {
    const { locationId: _locationId, ...rest } = validChallenge;
    const doc = new ChallengeModel(rest);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors.locationId).toBeDefined();
  });

  it('rejects a document with an empty questions array', () => {
    const doc = new ChallengeModel({ ...validChallenge, questions: [] });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors.questions).toBeDefined();
  });

  it('rejects a question with an invalid correctOption enum value', () => {
    const doc = new ChallengeModel({
      ...validChallenge,
      questions: [{ ...validQuestion, correctOption: 'Z' }],
    });
    const error = doc.validateSync();
    expect(error).toBeDefined();
  });

  it('ensures correctOption is one of the provided option keys', () => {
    const doc = new ChallengeModel(validChallenge);
    const question = doc.questions[0];
    const optionKeys = question.options.map((option) => option.key);
    expect(optionKeys).toContain(question.correctOption);
  });
});
