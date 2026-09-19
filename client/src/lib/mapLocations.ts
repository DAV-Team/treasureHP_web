import type { ApiLocation } from '../services/locations';
import type { Category } from './categories';
import type { LocationStatus } from './locationStatus';

export interface MapLocation {
  id: string;
  name: string;
  category: Category;
  description: string;
  address: string;
  xp: number;
  coverImageUrl: string;
  position: { lat: number; lng: number };
  status: LocationStatus;
}

export const HAI_PHONG_CENTER = { lat: 20.8449, lng: 106.6881 };

// Shown while the API is unreachable so the map is never empty. Mirrors the server seed data.
export const fallbackLocations: MapLocation[] = [
  { id: 'nha-hat-thanh-pho-hai-phong', name: 'Nhà hát thành phố Hải Phòng', category: 'architecture', description: 'Công trình kiến trúc Pháp cổ kính, mang đậm dấu ấn lịch sử và văn hóa thành phố.', address: 'Số 1 Trần Hưng Đạo, quận Hồng Bàng, Hải Phòng', xp: 50, coverImageUrl: '/images/opera-cover.jpg', position: { lat: 20.8593, lng: 106.6822 }, status: 'available' },
  { id: 'den-nghe', name: 'Đền Nghè', category: 'history', description: 'Nơi thờ nữ tướng Lê Chân, người có công lập nên vùng đất Hải Phòng.', address: 'Số 1 Đền Nghè, quận Lê Chân, Hải Phòng', xp: 50, coverImageUrl: '/images/card-mini-quest.jpg', position: { lat: 20.8558, lng: 106.684 }, status: 'completed' },
  { id: 'chua-du-hang', name: 'Chùa Dư Hàng', category: 'culture', description: 'Ngôi chùa hơn 300 năm tuổi, nét thiền tịnh giữa lòng phố cảng.', address: 'Số 121 Chùa Hàng, quận Lê Chân, Hải Phòng', xp: 40, coverImageUrl: '/images/card-full-quest.jpg', position: { lat: 20.8459, lng: 106.6747 }, status: 'locked' },
  { id: 'bao-tang-hai-phong', name: 'Bảo tàng Hải Phòng', category: 'art', description: 'Không gian lưu giữ hiện vật và câu chuyện về vùng đất cảng.', address: 'Số 66 Điện Biên Phủ, quận Hồng Bàng, Hải Phòng', xp: 40, coverImageUrl: '/images/opera-story.jpg', position: { lat: 20.8603, lng: 106.6838 }, status: 'available' },
  { id: 'hai-dang-hon-dau', name: 'Hải đăng Hòn Dáu', category: 'architecture', description: 'Ngọn hải đăng cổ bên biển Đồ Sơn, dẫn đường cho tàu thuyền hơn một thế kỷ.', address: 'Hòn Dáu, quận Đồ Sơn, Hải Phòng', xp: 60, coverImageUrl: '/images/lighthouse.jpg', position: { lat: 20.6664, lng: 106.8064 }, status: 'special' },
];

export function toMapLocation(location: ApiLocation): MapLocation {
  const status: LocationStatus = location.progress?.status === 'completed' ? 'completed' : location.isSpecialQuest ? 'special' : 'available';
  return {
    id: location._id,
    name: location.name,
    category: location.category,
    description: location.shortDescription,
    address: location.address,
    xp: location.xpReward,
    coverImageUrl: location.coverImageUrl,
    position: location.coordinates,
    status,
  };
}

export function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd');
}

// Demo/fallback locations use slugs as ids; only real Mongo ids are worth sending to the API.
export function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}
