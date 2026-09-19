import type { LocationCategory } from '../locations/schemas/location.schema.js';
import type { OptionKey } from '../challenges/schemas/challenge.schema.js';

export interface SeedLocation {
  name: string;
  slug: string;
  address: string;
  category: LocationCategory;
  coordinates: { lat: number; lng: number };
  coverImageUrl: string;
  shortDescription: string;
  cultureStory: { title: string; content: string; imageUrl: string };
  xpReward: number;
  isSpecialQuest: boolean;
  challenge: {
    levelName: string;
    xpReward: number;
    questions: Array<{
      order: number;
      imageUrl: string;
      highlightBox: { x: number; y: number; width: number; height: number };
      questionText: string;
      options: Array<{ key: OptionKey; text: string }>;
      correctOption: OptionKey;
      hintText: string;
    }>;
  };
}

export const SEED_LOCATIONS: SeedLocation[] = [
  {
    name: 'Nhà hát thành phố Hải Phòng',
    slug: 'nha-hat-thanh-pho-hai-phong',
    address: 'Số 1 Trần Hưng Đạo, quận Hồng Bàng, Hải Phòng',
    category: 'architecture',
    coordinates: { lat: 20.8593, lng: 106.6822 },
    coverImageUrl: '/images/locations/nha-hat-hai-phong/cover.jpg',
    shortDescription:
      'Công trình kiến trúc Pháp cổ điển, điểm đến lịch sử và văn hóa thành phố.',
    cultureStory: {
      title: 'Chứng nhân trăm năm giữa lòng thành phố Cảng',
      content:
        'Xây dựng từ năm 1904 theo lối kiến trúc Pháp, Nhà hát thành phố Hải Phòng là nơi diễn ra nhiều sự kiện lịch sử quan trọng, trong đó có cuộc mít tinh Tổng khởi nghĩa giành chính quyền năm 1945. Đến nay công trình vẫn giữ nguyên vẹn nét kiến trúc cổ điển châu Âu giữa lòng thành phố hiện đại.',
      imageUrl: '/images/locations/nha-hat-hai-phong/story.jpg',
    },
    xpReward: 50,
    isSpecialQuest: false,
    challenge: {
      levelName: 'The Hidden Detail',
      xpReward: 50,
      questions: [
        {
          order: 1,
          imageUrl: '/images/locations/nha-hat-hai-phong/q1.jpg',
          highlightBox: { x: 40, y: 15, width: 20, height: 25 },
          questionText: 'Chi tiết được khoanh tròn trong hình là biểu tượng gì?',
          options: [
            { key: 'A', text: 'Quốc huy' },
            { key: 'B', text: 'Mặt nạ tuồng' },
            { key: 'C', text: 'Bình an' },
            { key: 'D', text: 'Thành vượng' },
          ],
          correctOption: 'B',
          hintText: 'Đây là biểu tượng thường gặp ở các nhà hát châu Âu cổ điển, tượng trưng cho nghệ thuật sân khấu.',
        },
      ],
    },
  },
  {
    name: 'Đền Nghè',
    slug: 'den-nghe',
    address: 'Số 53 Lê Chân, quận Lê Chân, Hải Phòng',
    category: 'history',
    coordinates: { lat: 20.8558, lng: 106.684 },
    coverImageUrl: '/images/locations/den-nghe/cover.jpg',
    shortDescription: 'Ngôi đền thờ nữ tướng Lê Chân, người khai sinh ra vùng đất Hải Phòng.',
    cultureStory: {
      title: 'Nơi tưởng nhớ nữ tướng khai sinh thành phố',
      content:
        'Đền Nghè thờ nữ tướng Lê Chân — người có công khai khẩn vùng đất An Biên xưa, tiền thân của thành phố Hải Phòng ngày nay. Đền được xây dựng theo lối kiến trúc truyền thống với nhiều mảng chạm khắc gỗ tinh xảo mang đậm dấu ấn văn hóa Bắc Bộ.',
      imageUrl: '/images/locations/den-nghe/story.jpg',
    },
    xpReward: 50,
    isSpecialQuest: false,
    challenge: {
      levelName: 'Dấu Tích Nữ Tướng',
      xpReward: 50,
      questions: [
        {
          order: 1,
          imageUrl: '/images/locations/den-nghe/q1.jpg',
          highlightBox: { x: 30, y: 20, width: 25, height: 30 },
          questionText: 'Đền Nghè được lập nên để thờ ai?',
          options: [
            { key: 'A', text: 'Nữ tướng Lê Chân' },
            { key: 'B', text: 'Vua Lê Thánh Tông' },
            { key: 'C', text: 'Trần Hưng Đạo' },
            { key: 'D', text: 'Hai Bà Trưng' },
          ],
          correctOption: 'A',
          hintText: 'Người phụ nữ này được coi là người có công khai sinh ra vùng đất Hải Phòng.',
        },
      ],
    },
  },
  {
    name: 'Chùa Dư Hàng',
    slug: 'chua-du-hang',
    address: 'Số 121 Dư Hàng, quận Lê Chân, Hải Phòng',
    category: 'culture',
    coordinates: { lat: 20.8459, lng: 106.6747 },
    coverImageUrl: '/images/locations/chua-du-hang/cover.jpg',
    shortDescription: 'Một trong những ngôi chùa cổ và lớn nhất thành phố Hải Phòng.',
    cultureStory: {
      title: 'Chốn thiền tịnh giữa lòng đô thị',
      content:
        'Chùa Dư Hàng có lịch sử hơn 300 năm, là trung tâm Phật giáo lớn của Hải Phòng. Ngôi chùa từng là nơi hội họp bí mật của các chiến sĩ cách mạng trong thời kỳ kháng chiến chống Pháp, mang trong mình cả giá trị tâm linh lẫn lịch sử.',
      imageUrl: '/images/locations/chua-du-hang/story.jpg',
    },
    xpReward: 40,
    isSpecialQuest: false,
    challenge: {
      levelName: 'Tiếng Chuông Cổ Tự',
      xpReward: 40,
      questions: [
        {
          order: 1,
          imageUrl: '/images/locations/chua-du-hang/q1.jpg',
          highlightBox: { x: 45, y: 10, width: 15, height: 40 },
          questionText: 'Chùa Dư Hàng từng được sử dụng làm gì trong thời kỳ kháng chiến?',
          options: [
            { key: 'A', text: 'Kho lương thực' },
            { key: 'B', text: 'Nơi hội họp bí mật của chiến sĩ cách mạng' },
            { key: 'C', text: 'Trường học' },
            { key: 'D', text: 'Bệnh viện dã chiến' },
          ],
          correctOption: 'B',
          hintText: 'Đây là hoạt động liên quan đến cách mạng, không phải hoạt động dân sự thông thường.',
        },
      ],
    },
  },
  {
    name: 'Bảo tàng Hải Phòng',
    slug: 'bao-tang-hai-phong',
    address: 'Số 66 Điện Biên Phủ, quận Hồng Bàng, Hải Phòng',
    category: 'history',
    coordinates: { lat: 20.8603, lng: 106.6838 },
    coverImageUrl: '/images/locations/bao-tang-hai-phong/cover.jpg',
    shortDescription: 'Nơi lưu giữ hiện vật lịch sử và văn hóa của thành phố Cảng.',
    cultureStory: {
      title: 'Ký ức thành phố Cảng qua từng hiện vật',
      content:
        'Bảo tàng Hải Phòng được xây dựng từ thời Pháp thuộc, lưu giữ hàng ngàn hiện vật phản ánh quá trình hình thành và phát triển của thành phố Hải Phòng qua các thời kỳ, từ thời tiền sử đến hiện đại.',
      imageUrl: '/images/locations/bao-tang-hai-phong/story.jpg',
    },
    xpReward: 45,
    isSpecialQuest: false,
    challenge: {
      levelName: 'Hành Trình Ký Ức',
      xpReward: 45,
      questions: [
        {
          order: 1,
          imageUrl: '/images/locations/bao-tang-hai-phong/q1.jpg',
          highlightBox: { x: 20, y: 25, width: 30, height: 20 },
          questionText: 'Bảo tàng Hải Phòng được xây dựng từ thời kỳ nào?',
          options: [
            { key: 'A', text: 'Thời Pháp thuộc' },
            { key: 'B', text: 'Thời nhà Nguyễn' },
            { key: 'C', text: 'Sau năm 1975' },
            { key: 'D', text: 'Thời nhà Lê' },
          ],
          correctOption: 'A',
          hintText: 'Kiến trúc công trình mang phong cách phương Tây rõ nét.',
        },
      ],
    },
  },
  {
    name: 'Hải đăng Hòn Dáu',
    slug: 'hai-dang-hon-dau',
    address: 'Đảo Dáu, phường Đồ Sơn, Hải Phòng',
    category: 'architecture',
    coordinates: { lat: 20.6664, lng: 106.8064 },
    coverImageUrl: '/images/locations/hai-dang-hon-dau/cover.jpg',
    shortDescription: 'Ngọn hải đăng cổ nhất Việt Nam, biểu tượng của vùng biển Hải Phòng.',
    cultureStory: {
      title: 'Ánh sáng dẫn đường hơn một thế kỷ',
      content:
        'Được xây dựng từ năm 1892, Hải đăng Hòn Dáu là một trong những ngọn hải đăng cổ nhất Đông Dương, giữ vai trò dẫn đường cho tàu thuyền qua lại vùng biển Hải Phòng suốt hơn 130 năm qua.',
      imageUrl: '/images/locations/hai-dang-hon-dau/story.jpg',
    },
    xpReward: 60,
    isSpecialQuest: true,
    challenge: {
      levelName: 'Ánh Sáng Cuối Chân Trời',
      xpReward: 60,
      questions: [
        {
          order: 1,
          imageUrl: '/images/locations/hai-dang-hon-dau/q1.jpg',
          highlightBox: { x: 35, y: 5, width: 20, height: 50 },
          questionText: 'Hải đăng Hòn Dáu được xây dựng vào năm nào?',
          options: [
            { key: 'A', text: '1892' },
            { key: 'B', text: '1954' },
            { key: 'C', text: '1975' },
            { key: 'D', text: '2000' },
          ],
          correctOption: 'A',
          hintText: 'Công trình đã tồn tại hơn 130 năm, từ thời Pháp thuộc.',
        },
        {
          order: 2,
          imageUrl: '/images/locations/hai-dang-hon-dau/q2.jpg',
          highlightBox: { x: 10, y: 60, width: 30, height: 20 },
          questionText: 'Chức năng chính của hải đăng là gì?',
          options: [
            { key: 'A', text: 'Trang trí cảnh quan' },
            { key: 'B', text: 'Dẫn đường cho tàu thuyền' },
            { key: 'C', text: 'Đài quan sát quân sự' },
            { key: 'D', text: 'Trạm khí tượng' },
          ],
          correctOption: 'B',
          hintText: 'Nghĩ về vai trò của ánh sáng đèn biển vào ban đêm.',
        },
      ],
    },
  },
];

export const SEED_BADGES = [
  {
    code: 'history_hunter',
    name: 'History Hunter',
    description: 'Khám phá 3 địa điểm thuộc chủ đề Lịch sử',
    icon: 'history-hunter.svg',
    colorTheme: 'orange',
    unlockCondition: { type: 'locationsInCategory' as const, value: 2, category: 'history' as LocationCategory },
  },
  {
    code: 'culture_keeper',
    name: 'Culture Keeper',
    description: 'Khám phá 5 câu chuyện văn hóa',
    icon: 'culture-keeper.svg',
    colorTheme: 'purple',
    unlockCondition: { type: 'totalLocations' as const, value: 5 },
  },
  {
    code: 'food_explorer',
    name: 'Food Explorer',
    description: 'Thử thách ẩm thực đầu tiên của bạn',
    icon: 'food-explorer.svg',
    colorTheme: 'red',
    unlockCondition: { type: 'locationsInCategory' as const, value: 1, category: 'cuisine' as LocationCategory },
  },
  {
    code: 'city_master',
    name: 'City Master',
    description: 'Hoàn thành trọn vẹn Full Quest Hải Phòng',
    icon: 'city-master.svg',
    colorTheme: 'blue',
    unlockCondition: { type: 'fullQuestCompleted' as const, value: 1 },
  },
];
