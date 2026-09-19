import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { LocationSchema } from './location.schema.js';

const LocationModel = mongoose.model('LocationSchemaSpec', LocationSchema);

const validLocation = {
  name: 'Nhà hát thành phố Hải Phòng',
  slug: 'nha-hat-thanh-pho-hai-phong',
  address: 'Số 1 Trần Hưng Đạo, Hồng Bàng, Hải Phòng',
  category: 'architecture',
  coordinates: { lat: 20.8593, lng: 106.6822 },
  coverImageUrl: '/images/cover.jpg',
  shortDescription: 'Mô tả ngắn',
  cultureStory: { title: 'Tiêu đề', content: 'Nội dung', imageUrl: '/images/story.jpg' },
  xpReward: 50,
  isSpecialQuest: false,
};

describe('Location schema', () => {
  it('accepts a fully valid document', () => {
    const doc = new LocationModel(validLocation);
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it('rejects a document missing a required field (name)', () => {
    const { name: _name, ...rest } = validLocation;
    const doc = new LocationModel(rest);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors.name).toBeDefined();
  });

  it('rejects a document missing coordinates', () => {
    const { coordinates: _coordinates, ...rest } = validLocation;
    const doc = new LocationModel(rest);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors.coordinates).toBeDefined();
  });

  it('rejects an invalid category enum value', () => {
    const doc = new LocationModel({ ...validLocation, category: 'invalid-category' });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors.category).toBeDefined();
  });
});
