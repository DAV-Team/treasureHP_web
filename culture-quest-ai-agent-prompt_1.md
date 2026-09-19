# 🧭 PROMPT CHO AI AGENT — XÂY DỰNG WEBSITE "CULTURE QUEST"

> File này dùng để đưa trực tiếp cho một AI coding agent (Claude Code, Cursor, v.v.) làm **system/task prompt** khi bắt tay xây dựng dự án. Đính kèm cùng prompt này 7 ảnh mockup UI (trang chủ, chọn quest, bản đồ, chi tiết quest, câu hỏi thử thách, hoàn thành quest, hồ sơ/huy hiệu) để agent bám sát pixel-level khi dựng giao diện.

---

## 1. Bối cảnh dự án

Xây dựng **Culture Quest** — một web app dạng "game khám phá văn hóa" cho phép du khách (chủ yếu Gen Z, dùng điện thoại) khám phá thành phố Hải Phòng bằng cách di chuyển đến các địa danh thật, giải đố tại chỗ để mở khóa kiến thức văn hóa, tích XP và nhận huy hiệu.

Đây **không phải** một bản đồ du lịch thông thường — trải nghiệm phải giống chơi game: *đến địa điểm → giải đố → mở khóa "Culture Story" → nhận thưởng → khám phá tiếp.*

Kiến trúc kỹ thuật (cấu trúc thư mục, quy ước code, bảo mật) tham khảo theo mô hình đã phân tích từ repo `hccln` (dự án TUANCUONG COMPUTER — monorepo `client/` + `server/`, NestJS modular theo domain, JWT + RBAC, Docker Compose), nhưng **thay toàn bộ tầng dữ liệu từ PostgreSQL/Prisma sang MongoDB**.

---

## 2. Tech Stack bắt buộc

| Thành phần | Công nghệ | Ghi chú |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS 4 | Mobile-first, giống pattern `client/` của hccln |
| **Routing** | react-router-dom 7 | |
| **HTTP client** | axios | |
| **Icon** | lucide-react | Khớp icon set dùng trong mockup (map pin, badge, star, lock...) |
| **Backend** | NestJS 12 + TypeScript | Modular theo domain, giống `server/src/<module>` của hccln |
| **Database** | **MongoDB** (Atlas hoặc container `mongo:7`) | ⚠️ Thay thế hoàn toàn PostgreSQL/Prisma |
| **ODM** | **Mongoose** (`@nestjs/mongoose`) | Không dùng Prisma — Mongoose phù hợp hơn với schema linh hoạt (câu hỏi quiz đa dạng, JSON lồng nhau) |
| **Auth** | JWT (`@nestjs/jwt`, `passport-jwt`) + bcrypt | Đăng ký/đăng nhập, lưu XP & tiến độ theo user |
| **Bảo mật** | Helmet, `@nestjs/throttler` (rate limit), class-validator/class-transformer (DTO validation) | Giữ nguyên chuẩn bảo mật như hccln |
| **Bản đồ** | Leaflet hoặc Mapbox GL JS (miễn phí, tùy chỉnh marker dễ) | Hiển thị bản đồ Hải Phòng với marker theo trạng thái |
| **Container & triển khai** | Docker, Docker Compose (mongo + server + client), Nginx reverse proxy | Theo đúng mô hình `docker-compose.prod.yml` của hccln, đổi service `postgres` → `mongo` |
| **Test — backend** | Vitest + supertest (API e2e) + `mongodb-memory-server` (DB in-memory, không đụng DB thật) | |
| **Test — frontend** | Vitest + React Testing Library (component), Playwright (E2E luồng người dùng + screenshot đối chiếu mockup) | |
| **Lint** | oxlint (chạy như một test gate, không chỉ chạy tay) | |

---

## 3. Cấu trúc thư mục đề xuất

```
culture-quest/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── QuestSelectPage.tsx
│   │   │   ├── MapPage.tsx
│   │   │   ├── LocationDetailPage.tsx
│   │   │   ├── ChallengePage.tsx          # modal hoặc route riêng
│   │   │   ├── QuestCompletedPage.tsx
│   │   │   ├── ProfileBadgesPage.tsx
│   │   │   └── auth/ (LoginPage, RegisterPage)
│   │   ├── components/
│   │   │   ├── common/ (Navbar, Button, Card, Badge, ProgressBar, Modal, Chip)
│   │   │   ├── map/ (MapView, LocationMarker, LocationCard)
│   │   │   └── quest/ (ChallengeModal, CultureStoryCard, BadgeCard)
│   │   ├── context/ (AuthContext, QuestProgressContext)
│   │   ├── services/ (api.ts, auth.service.ts, locations.service.ts, quests.service.ts)
│   │   └── types/
│   └── ... (Vite/Tailwind config như hccln)
├── server/
│   ├── src/
│   │   ├── auth/            # JWT, bcrypt, passport strategy
│   │   ├── users/           # profile, level, tổng XP
│   │   ├── locations/       # địa danh (thay cho "branches" bên hccln)
│   │   ├── quests/          # Full/Mini/Explore, danh sách nhiệm vụ theo địa điểm
│   │   ├── challenges/      # câu hỏi/thử thách tại từng địa điểm
│   │   ├── progress/        # tiến độ user: đã hoàn thành, XP log
│   │   ├── badges/          # huy hiệu, điều kiện mở khóa
│   │   ├── culture-stories/ # nội dung "Culture Story" mở khóa sau khi giải đố
│   │   └── common/          # filters, guards, decorators
│   └── ... (NestJS + Mongoose module setup)
├── docker-compose.yml          # dev: chỉ mongo
├── docker-compose.prod.yml     # mongo + server + client + nginx
└── docs/
    └── 01_OVERVIEW_AND_ARCHITECTURE.md ...
```

---

## 4. Design System (rút ra từ ảnh mockup)

> Các mã màu dưới đây là **giá trị tham khảo** suy ra từ ảnh; agent nên lấy màu chính xác bằng eyedropper trên ảnh mockup đính kèm khi dựng UI thật.

**Bảng màu**
- Nền tối chủ đạo (trang kết quả, hồ sơ): xanh navy đậm gradient, khoảng `#0B1E3D → #142B52`
- Nền sáng (trang chủ, chọn quest, bản đồ): trắng/off-white `#F8FAFC`, card trắng `#FFFFFF`
- Màu nhấn chính (nút, badge số điểm, trạng thái chọn): xanh navy đậm `#12294D` / `#1B3A6B`
- Màu vàng/gold (XP, ngôi sao, ưu đãi): `#F5B942` – `#FFC94A`
- Icon danh mục nhiều màu: cam đỏ (Lịch sử/Ẩm thực), tím (Văn hóa), xanh lá (Kiến trúc), hồng (Nghệ thuật) — mỗi danh mục 1 màu cố định, dùng nhất quán xuyên suốt app (icon, chip lọc, marker bản đồ, badge)
- Trạng thái marker bản đồ: xanh lá 🟢 hoàn thành, xanh dương 🔵 có thể chơi, xám khóa 🔒 chưa mở, cam/vàng ⭐ quest đặc biệt

**Typography**
- Heading: sans-serif đậm (dạng Inter/Poppins Bold), cỡ lớn cho hero (~36–40px), navy đậm trên nền sáng / trắng trên nền tối
- Body: sans-serif thường, cỡ 14–16px, màu xám đậm trên nền sáng

**Component patterns quan sát được trong mockup**
- Navbar cố định: logo (icon ghim bản đồ + chữ "Culture Quest") bên trái, menu giữa (Trang chủ, Bản đồ, Quest của tôi, Huy hiệu), icon tìm kiếm + avatar/tên user bên phải
- Card bo góc lớn (`rounded-2xl`), shadow nhẹ, ảnh cover phía trên + nội dung phía dưới
- Nút chính: pill/rounded-full, nền navy đậm, chữ trắng, có icon mũi tên `→`
- Nút phụ/outline: viền mảnh, nền trắng hoặc trong suốt
- Chip lọc (chủ đề/thời gian): dạng pill nhỏ, trạng thái chọn = nền navy đậm chữ trắng, chưa chọn = viền mỏng nền trắng
- Badge tròn (huy hiệu): icon khiên/huy chương màu theo chủ đề, trạng thái khóa = ảnh xám + icon ổ khóa overlay
- Progress bar mỏng, bo tròn, màu navy trên nền track xám nhạt
- Wave/curve divider trắng cắt ngang ảnh hero ở trang chủ
- Modal câu hỏi: ảnh có khung đỏ khoanh chi tiết cần tìm, stepper "1/3" phía trên, 4 lựa chọn dạng radio card, nút "Gợi ý" (trợ giúp) + "Tiếp theo"
- Trang "Quest Completed": nền tối toàn màn hình, hiệu ứng confetti/sao trang trí, badge tròn lớn ở giữa, 2 nút outline trắng cạnh nhau

**Nguyên tắc UI/UX bắt buộc**
- Mobile-first, responsive đầy đủ xuống 375px
- Icon + màu sắc nhất quán cho từng danh mục xuyên suốt toàn bộ app (trang chủ, bộ lọc, marker bản đồ, thẻ địa điểm)
- Animation nhẹ (transition, hover scale nhỏ, fade) — không animation nặng ảnh hưởng hiệu năng mobile
- Nguyên tắc "giải đố trước, đọc thông tin sau": Culture Story luôn ở trạng thái khóa cho đến khi trả lời đúng thử thách

---

## 5. Danh sách trang & yêu cầu chi tiết

### 5.1. Trang chủ (`/`)
- Navbar (logo, menu, search, avatar)
- Hero: ảnh nền địa danh Hải Phòng (gradient overlay xanh trời), tiêu đề "Khám phá Hải Phòng theo cách của bạn", dòng slogan "Đến → Khám phá → Giải đố → Hiểu văn hóa → Nhận thưởng", nút CTA "Bắt đầu Quest"
- Wave divider bo cong dưới hero
- Hàng icon danh mục (Lịch sử, Văn hóa, Ẩm thực, Kiến trúc, Nghệ thuật) — bấm vào để lọc nhanh sang trang bản đồ/chọn quest theo chủ đề

### 5.2. Trang chọn Quest (`/quests/select`)
- Nút quay lại + heading "Chọn cách bạn muốn khám phá"
- 3 card lựa chọn: **Full Quest** (có badge "Được đề xuất"), **Mini Quest**, **Explore Freely** — mỗi card: ảnh, tiêu đề, mô tả, nút hành động riêng (Bắt đầu / Tùy chọn / Khám phá)
- Bộ lọc "Lọc theo chủ đề" (chip icon: Tất cả, Lịch sử, Văn hóa, Kiến trúc, Ẩm thực, Nghệ thuật) và "Thời gian" (30 phút, 1 giờ, 2+ giờ)
- Chọn xong → điều hướng sang `/map` với query filter tương ứng

### 5.3. Bản đồ tương tác (`/map`)
- Sidebar trái: ô tìm kiếm địa điểm, checkbox "Danh mục" (Tất cả + 5 chủ đề), legend "Trạng thái" (4 icon màu như mục 4)
- Bản đồ chính (Leaflet/Mapbox) hiển thị khu vực Hải Phòng, marker theo trạng thái tiến độ của user
- Bấm marker → mở floating card: ảnh, tên địa điểm, tag danh mục, mô tả ngắn, "+XP" và nút "Xem chi tiết" → điều hướng `/locations/:id`

### 5.4. Chi tiết địa điểm / Quest tại địa điểm (`/locations/:id`)
- Ảnh cover địa điểm, tên, tag danh mục, địa chỉ (icon pin)
- Khối "Nhiệm vụ": mô tả nhiệm vụ + gợi ý (ẩn/hiện), nút "Bắt đầu thử thách" → mở `ChallengeModal`
- Sidebar phải: thẻ "Level N — <tên thử thách>" với progress (x/y câu), badge "+XP"; thẻ "Culture Story" — khóa (icon ổ khóa) cho tới khi hoàn thành thử thách, sau đó hiện đoạn văn 50–100 chữ kèm minh họa

### 5.5. Modal thử thách / câu hỏi (component, không nhất thiết route riêng)
- Stepper trên cùng dạng "1/3" + nút đóng
- Ảnh có vùng khoanh đỏ (dùng ảnh với overlay `<div>` tọa độ % hoặc ảnh đã edit sẵn)
- Câu hỏi trắc nghiệm 4 đáp án dạng radio-card, trạng thái chọn = viền xanh navy + tick
- Nút "Gợi ý" (mở tooltip/text gợi ý) và "Tiếp theo" (dark, full width trên mobile)
- Trả lời đúng toàn bộ chuỗi câu hỏi của Level → cộng XP, mở khóa Culture Story, cập nhật tiến độ user trong DB
- Hoàn thành toàn bộ nhiệm vụ tại địa điểm → điều hướng `/quests/completed?locationId=...`

### 5.6. Trang kết quả (`/quests/completed`)
- Nền tối, hiệu ứng confetti/sao
- "QUEST COMPLETED!" + tổng XP nhận (+150 XP)
- Badge huy hiệu tròn lớn (tên huy hiệu, vd "History Hunter")
- Progress "x/5 địa điểm đã khám phá" + dãy icon nhỏ các địa điểm
- 2 nút: "Khám phá tiếp" (quay lại map) / "Xem bản đồ"

### 5.7. Hồ sơ & Huy hiệu (`/profile`)
- Header tối: avatar, tên, "Level N — <danh hiệu>", progress bar cấp độ
- Tabs "Huy hiệu" / "Lịch sử"
- 3 thẻ thống kê: số địa điểm đã khám phá, số huy hiệu đã nhận, số quest đang chơi
- Lưới huy hiệu (grid card): icon màu theo chủ đề khi đã mở khóa, ảnh xám + icon khóa khi chưa đạt điều kiện, kèm mô tả điều kiện mở khóa (vd "Khám phá 5 câu chuyện văn hóa")
- Card trích dẫn cuối trang kèm minh họa (địa danh biểu tượng, vd ngọn hải đăng)

### 5.8. Auth (`/login`, `/register`)
- Form tối giản, cùng ngôn ngữ thiết kế (card bo góc, nút navy pill)
- Đăng nhập để lưu tiến độ/XP theo tài khoản; cho phép trải nghiệm giới hạn ở chế độ khách (guest) nếu cần, nhưng badge/XP chỉ lưu vĩnh viễn khi đã đăng nhập

---

## 6. Mô hình dữ liệu (MongoDB collections)

```ts
// users
{
  _id, email, passwordHash, name, avatarUrl,
  level: number, totalXp: number,
  createdAt, updatedAt
}

// locations
{
  _id, name, slug, address, category: "history"|"culture"|"cuisine"|"architecture"|"art",
  coordinates: { lat, lng },
  coverImageUrl, shortDescription,
  cultureStory: { title, content, imageUrl },   // nội dung mở khóa sau khi giải đố
  xpReward: number,
  isSpecialQuest: boolean,
  createdAt, updatedAt
}

// challenges  (nhiều câu hỏi cho 1 location, gộp thành 1 "level")
{
  _id, locationId, levelName: "The Hidden Detail",
  questions: [
    {
      order: number,
      imageUrl,
      highlightBox: { x, y, width, height },  // % toạ độ khoanh vùng trên ảnh
      questionText,
      options: [{ key: "A"|"B"|"C"|"D", text }],
      correctOption,
      hintText
    }
  ],
  xpReward: number
}

// user_progress
{
  _id, userId, locationId,
  status: "locked" | "available" | "completed",
  answeredQuestions: [{ questionOrder, selectedOption, isCorrect, answeredAt }],
  cultureStoryUnlocked: boolean,
  xpEarned: number,
  completedAt
}

// badges
{
  _id, code: "history_hunter", name, description, icon, colorTheme,
  unlockCondition: { type: "locationsInCategory"|"totalLocations"|"fullQuestCompleted", value, category? }
}

// user_badges
{
  _id, userId, badgeId, unlockedAt
}

// quest_sessions  (Full/Mini/Explore đang chơi)
{
  _id, userId, type: "full"|"mini"|"explore",
  locationIds: [ObjectId], status: "in_progress"|"completed",
  startedAt, completedAt
}
```

---

## 7. API chính (NestJS REST)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| POST | `/auth/register`, `/auth/login` | Đăng ký/đăng nhập, trả JWT |
| GET | `/locations` | Danh sách địa điểm (filter theo category, status theo user) |
| GET | `/locations/:id` | Chi tiết địa điểm + culture story (ẩn nếu chưa mở khóa) |
| GET | `/locations/:id/challenge` | Lấy bộ câu hỏi (ẩn `correctOption`) |
| POST | `/locations/:id/challenge/answer` | Gửi đáp án 1 câu, trả đúng/sai + gợi ý nếu sai |
| POST | `/locations/:id/complete` | Hoàn tất toàn bộ level → cộng XP, mở Culture Story, cập nhật progress |
| GET | `/users/me` | Thông tin hồ sơ, level, tổng XP |
| GET | `/users/me/progress` | Tiến độ chi tiết theo từng địa điểm |
| GET | `/badges`, `/users/me/badges` | Danh sách huy hiệu + trạng thái mở khóa của user |
| POST | `/quests/sessions` | Bắt đầu 1 quest session (full/mini/explore) |
| PATCH | `/quests/sessions/:id` | Cập nhật tiến độ / hoàn thành session |

Tất cả endpoint ghi dữ liệu (answer, complete, sessions) **yêu cầu JWT**; áp dụng Throttler để chống spam trả lời đáp án.

---

## 8. Yêu cầu phi chức năng

- Toàn bộ nội dung UI bằng **tiếng Việt**, giữ nguyên văn phong "game hoá" như trong mockup (VD: "Bắt đầu Quest", "Quest Completed!", "Huy hiệu")
- Mobile-first, kiểm thử tối thiểu ở 375px, 768px, 1280px
- Helmet + rate limiting + validate DTO đầy đủ ở mọi input (đặc biệt endpoint trả lời câu hỏi, tránh gian lận XP)
- Đáp án đúng (`correctOption`) **không bao giờ** trả về client trước khi user trả lời
- Docker Compose dev chỉ chạy MongoDB; prod chạy đủ `mongo + server + client + nginx`, biến môi trường (`MONGODB_URI`, `JWT_SECRET`) không hard-code giá trị thật trong file compose

---

## 9. Quy trình triển khai theo vòng lặp (build → test → fix → gate)

> ⚠️ **Quy tắc bắt buộc:** agent **không được** chuyển sang stage tiếp theo khi stage hiện tại chưa qua đủ "cổng kiểm thử" (test gate). Mỗi stage đều chạy theo vòng lặp dưới đây; nếu test fail thì sửa và chạy lại, tối đa 3 vòng — vẫn fail thì dừng lại, báo cáo nguyên nhân thay vì bỏ qua test hoặc sửa test cho dễ pass.

**Vòng lặp chuẩn của mỗi stage:**

```
┌──────────────────────────────────────────────────────┐
│  1. IMPLEMENT  — viết code cho phạm vi của stage      │
│  2. SELF-CHECK — oxlint + tsc --noEmit, 0 lỗi         │
│  3. TEST       — viết & chạy test của stage           │
│  4. VERIFY     — đối chiếu tiêu chí nghiệm thu        │
│  5. FIX        — fail → sửa → quay lại bước 2         │
│  6. REPORT     — tóm tắt: đã làm gì, test nào pass    │
└──────────────────────────────────────────────────────┘
        ↓ chỉ khi TẤT CẢ gate pass → stage kế tiếp
```

**Nguyên tắc chống "test giả":** không được dùng `it.skip`, comment out test đang fail, nới lỏng assertion, hay mock chính logic đang cần kiểm thử để test pass. Test phải kiểm tra hành vi thật.

---

### Stage 0 — Scaffold & hạ tầng test
**Làm:** Dựng monorepo `client/` (Vite + React + TS + Tailwind) và `server/` (NestJS + Mongoose), kết nối MongoDB, cấu hình sẵn Vitest, supertest, `mongodb-memory-server`, React Testing Library, Playwright.
**Test gate:**
- `npm run lint` và `tsc --noEmit` pass ở cả 2 workspace
- 1 smoke test backend: `GET /health` trả 200
- 1 smoke test frontend: render `App` không lỗi
- Playwright chạy được ít nhất 1 test mở trang chủ

### Stage 1 — Schema & seed dữ liệu
**Làm:** Định nghĩa 6 collection ở mục 6, viết script seed 3–5 địa điểm Hải Phòng kèm bộ câu hỏi thật.
**Test gate:**
- Unit test validate schema: field bắt buộc thiếu → reject; enum `category` sai giá trị → reject
- Test seed chạy trên `mongodb-memory-server`: đúng số document, `coordinates` nằm trong khung tọa độ Hải Phòng
- Mỗi `challenge` seed phải có ≥1 câu hỏi và `correctOption` nằm trong danh sách `options`

### Stage 2 — Auth & users
**Làm:** Module `auth` (JWT + bcrypt) và `users`.
**Test gate:**
- E2E API: register → login → gọi `/users/me` bằng token → 200; không token → 401; token sai/hết hạn → 401
- Test bảo mật: response **không bao giờ** chứa `passwordHash`; mật khẩu lưu trong DB đã hash (khác plaintext)
- Test throttler: gọi `/auth/login` vượt ngưỡng → 429

### Stage 3 — Locations & challenges API
**Làm:** Module `locations`, `challenges`, kèm filter theo category.
**Test gate:**
- E2E: `GET /locations` trả đúng số lượng, lọc `?category=history` trả đúng tập con
- 🔒 **Test chống gian lận (bắt buộc):** `GET /locations/:id/challenge` **không** chứa field `correctOption` trong bất kỳ câu hỏi nào
- 🔒 `GET /locations/:id` khi user chưa mở khóa → **không** trả `cultureStory.content`
- Test 404 cho id không tồn tại, 400 cho id sai định dạng ObjectId

### Stage 4 — Progress, XP & badges
**Làm:** Module `progress`, logic cộng XP, mở khóa Culture Story, `badges`.
**Test gate:**
- E2E luồng đúng: trả lời đủ đúng → XP cộng chính xác, `cultureStoryUnlocked = true`, `GET /locations/:id` sau đó **có** `cultureStory.content`
- E2E luồng sai: trả lời sai → không cộng XP, story vẫn khóa
- 🔒 **Test chống cộng XP lặp:** gọi `/locations/:id/complete` 2 lần → XP chỉ cộng 1 lần
- 🔒 Test không thể complete hộ user khác (token A không tác động được progress của user B)
- Test mở khóa badge: đủ điều kiện → badge xuất hiện trong `/users/me/badges`; chưa đủ → vẫn khóa
- Test tính level từ `totalXp` đúng mốc

### Stage 5 — Component library (frontend)
**Làm:** Dựng `common/` (Button, Card, Chip, ProgressBar, Badge, Modal) theo design system mục 4.
**Test gate:**
- RTL test cho từng component: render đúng biến thể (primary/outline, chip selected/unselected, badge locked/unlocked)
- Test accessibility cơ bản: button có accessible name, modal có `role="dialog"` và đóng được bằng phím `Esc`
- Test `ProgressBar` render đúng % với các giá trị biên (0%, 50%, 100%)

### Stage 6 — Dựng từng trang (lặp lại vòng lặp cho MỖI trang)
**Làm:** Lần lượt Trang chủ → Chọn Quest → Bản đồ → Chi tiết địa điểm → Modal thử thách → Kết quả → Hồ sơ.
**Test gate áp dụng cho từng trang, không gộp cuối:**
- RTL: các phần tử chính theo mục 5 đều render (heading, CTA, card, filter…)
- Playwright: chụp screenshot ở 375px / 768px / 1280px, **tự đối chiếu với ảnh mockup tương ứng** về bố cục, màu chủ đạo, vị trí CTA — lệch rõ rệt thì sửa UI trước khi đi tiếp
- Không có horizontal scroll ở 375px; không lỗi console
- Riêng modal thử thách: test chọn đáp án → state selected đúng; nút "Tiếp theo" disabled khi chưa chọn; stepper nhảy đúng 1/3 → 2/3 → 3/3

### Stage 7 — Nối API thật, bỏ mock
**Làm:** Thay toàn bộ dữ liệu mock bằng API thật.
**Test gate:**
- Playwright E2E xuyên suốt: đăng nhập → chọn Full Quest → mở bản đồ → chọn địa điểm → giải đủ 3 câu → thấy màn hình "Quest Completed" với đúng số XP → vào `/profile` thấy huy hiệu mới
- Test trạng thái lỗi: API 500/timeout → UI hiện thông báo lỗi, không crash trắng màn hình
- Test loading state & empty state (bản đồ không có địa điểm khớp filter)

### Stage 8 — Docker hoá & kiểm thử tích hợp
**Làm:** `docker-compose.yml` (dev: mongo) và `docker-compose.prod.yml` (mongo + server + client + nginx).
**Test gate:**
- `docker compose -f docker-compose.prod.yml up` khởi động sạch từ máy trắng, healthcheck mongo pass
- Chạy lại bộ Playwright E2E **trên môi trường Docker**, không chỉ trên dev server
- 🔒 Kiểm tra không có secret thật hard-code trong compose/`.env.example`

### Stage 9 — Regression & bàn giao
**Làm:** Viết `docs/01_OVERVIEW_AND_ARCHITECTURE.md`, tổng kết.
**Test gate cuối:**
- Chạy **toàn bộ** test suite (backend unit + e2e, frontend component + Playwright) — 100% pass
- Coverage backend cho `progress` và `challenges` ≥ 80% (đây là nơi chứa logic XP & chống gian lận)
- Checklist bảo mật mục 8 được xác nhận lại bằng test, không bằng lời

---

## 10. Bộ test tối thiểu phải có (checklist nghiệm thu)

| Nhóm | Test bắt buộc |
| :--- | :--- |
| **Bảo mật dữ liệu** | `correctOption` không lộ qua API; `cultureStory` khóa khi chưa hoàn thành; `passwordHash` không lộ |
| **Chống gian lận XP** | Không cộng XP 2 lần cho cùng địa điểm; không thao tác được progress của user khác; endpoint ghi luôn yêu cầu JWT |
| **Logic game** | Cộng XP đúng số, mở khóa story đúng thời điểm, badge mở khóa đúng điều kiện, level tính đúng mốc |
| **Giao diện** | Mỗi trang có test render + screenshot 3 breakpoint đối chiếu mockup |
| **Luồng người dùng** | Ít nhất 1 E2E xuyên suốt: login → quest → giải đố → completed → profile |
| **Khả năng phục hồi** | UI xử lý được API lỗi/timeout, empty state, loading state |

---

*Ghi chú cho người dùng prompt này: đính kèm 7 ảnh mockup gốc khi giao cho AI agent để agent đối chiếu pixel-level ở Stage 6; file này chỉ mô tả lại bằng văn bản làm cơ sở dự phòng khi agent không xử lý được ảnh.*
