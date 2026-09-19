# Culture Quest

Web game khám phá văn hóa Hải Phòng: đến địa điểm thật, giải đố, mở khóa câu chuyện văn hóa, tích XP và nhận huy hiệu.

| Thành phần | Công nghệ |
| :--- | :--- |
| `client/` | React 19, Vite, Tailwind CSS 4, Google Maps (hoặc OpenStreetMap/CARTO khi chưa có key) |
| `server/` | NestJS, Mongoose, JWT |
| Database | MongoDB 7, database `culture-quest` |
| Chạy thật | Docker Compose: `mongo` + `server` + `client` (nginx phục vụ web và chuyển `/api` sang server) |

Tài liệu này có hai phần chính: **[chạy bằng Docker](#1-chạy-bằng-docker-cách-nhanh-nhất)** (khuyến nghị) và **[đóng gói mang sang máy khác](#3-đóng-gói-để-mang-sang-máy-khác)**.

---

## 1. Chạy bằng Docker (cách nhanh nhất)

### Yêu cầu

- Docker Desktop (Windows/macOS) hoặc Docker Engine + Compose v2 (Linux). Kiểm tra: `docker compose version`.
- Cổng **8080** còn trống (đổi được, xem mục 2).
- Khoảng 3 GB đĩa trống và có Internet ở lần chạy đầu (để tải image và thư viện), trừ khi dùng [gói offline](#3-đóng-gói-để-mang-sang-máy-khác).
- Windows: bật WSL2 trong Docker Desktop, chạy lệnh trong **WSL** hoặc **Git Bash**.

### Các bước

```bash
# 1. Giải nén gói (hoặc clone dự án) rồi vào thư mục
cd culture-quest-YYYYMMDD

# 2. Chạy script cài đặt
bash scripts/setup.sh
```

Script tự làm các việc sau:

1. Tạo `.env.production` với `JWT_SECRET` và mật khẩu admin **ngẫu nhiên** (chỉ khi file chưa có).
2. Nạp image có sẵn trong gói (nếu có), nếu không thì build từ mã nguồn (vài phút ở lần đầu).
3. Khởi động `mongo`, `server`, `client` và chờ website trả lời.
4. Nạp dữ liệu mẫu (5 địa điểm, 5 thử thách, 4 huy hiệu), **chỉ khi database còn trống**.

Xong thì mở:

- Website: http://localhost:8080
- Trang quản trị: http://localhost:8080/admin. Tài khoản `admin@culturequest.local`, mật khẩu là giá trị `ADMIN_PASSWORD` trong `.env.production`.

Chạy lại `setup.sh` bất cứ lúc nào là an toàn: nó giữ nguyên cấu hình và dữ liệu hiện có.

### Không dùng được script? Chạy thủ công

```bash
cp .env.production.example .env.production      # Windows PowerShell: Copy-Item ...
# Mở .env.production và ĐỔI JWT_SECRET, ADMIN_PASSWORD thành giá trị của bạn

docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# Chỉ chạy lệnh này lần đầu (database trống). Nó xóa và nạp lại địa điểm, thử thách, huy hiệu.
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm --no-deps server node dist/database/seed-cli.js
```

---

## 2. Cấu hình (`.env.production`)

| Biến | Ý nghĩa | Mặc định |
| :--- | :--- | :--- |
| `JWT_SECRET` | Khóa ký đăng nhập. **Bắt buộc**, dùng chuỗi dài ngẫu nhiên | `setup.sh` tự sinh |
| `JWT_EXPIRES_IN` | Thời hạn đăng nhập | `7d` |
| `ADMIN_EMAIL` | Email tài khoản admin | `admin@culturequest.local` |
| `ADMIN_PASSWORD` | Mật khẩu admin. **Bắt buộc.** Chỉ dùng khi tạo admin lần đầu lúc server khởi động; đổi sau đó ở trang **Cài đặt tài khoản** | `setup.sh` tự sinh |
| `WEB_PORT` | Cổng website trên máy | `8080` |
| `VITE_GOOGLE_MAPS_API_KEY` | Khóa Google Maps. Để trống thì bản đồ dùng OpenStreetMap/CARTO | trống |
| `VITE_GOOGLE_MAPS_MAP_ID` | Map ID Google (không bắt buộc) | trống |

Đổi cổng hoặc mật khẩu xong: `docker compose --env-file .env.production -f docker-compose.prod.yml up -d`.

Hai biến `VITE_*` được **nhúng lúc build**, nên sau khi sửa phải build lại: thêm `--build` vào lệnh trên.

### Bật Google Maps

1. Google Cloud Console: bật **Maps JavaScript API** và tạo API key.
2. Giới hạn key theo domain (HTTP referrer) vì key nằm công khai trong mã JavaScript của web.
3. Điền `VITE_GOOGLE_MAPS_API_KEY`, rồi chạy lại lệnh có `--build`.

---

## 3. Đóng gói để mang sang máy khác

Chạy trên máy đã có dự án:

```bash
bash scripts/package.sh                  # gói mã nguồn (nhỏ, ~1 MB)
bash scripts/package.sh --with-images    # gói offline kèm image Docker (~375 MB)
```

Kết quả nằm trong `release/` (cả `.tar.gz` và `.zip`). Gói **không** chứa file `.env`, `node_modules` hay thư mục build.

| | Gói mã nguồn | Gói offline (`--with-images`) |
| :--- | :--- | :--- |
| Dung lượng | ~1 MB | ~375 MB |
| Máy đích cần Internet | Có, lần đầu (tải image và thư viện, build vài phút) | Không |
| Kiến trúc CPU máy đích | Bất kỳ | **Phải giống máy đóng gói** (`arm64` hay `amd64`) |

Nếu gói offline khác kiến trúc CPU (ví dụ đóng gói trên Mac M1/M2, chạy trên PC Intel/AMD), `setup.sh` tự bỏ qua image có sẵn và build từ mã nguồn. Khi đó máy đích cần Internet.

Muốn gói offline có Google Maps thì đặt biến khi đóng gói: `VITE_GOOGLE_MAPS_API_KEY=... bash scripts/package.sh --with-images`.

### Trên máy đích

1. Cài Docker (xem [Yêu cầu](#yêu-cầu)).
2. Chép và giải nén gói, rồi:
   ```bash
   cd culture-quest-YYYYMMDD          # hoặc culture-quest-YYYYMMDD-offline-<arch>
   bash scripts/setup.sh
   ```
3. Mở http://localhost:8080.

Dữ liệu người chơi **không** đi theo gói. Muốn mang cả dữ liệu, dùng sao lưu ở mục 5.

---

## 4. Chạy chế độ phát triển (không đóng gói)

Cần Node.js 22+ và MongoDB 7 (dùng Docker hoặc cài sẵn).

```bash
# MongoDB (cổng 27017). Bỏ qua nếu máy đã có MongoDB.
docker compose up -d

# Server  ->  http://localhost:3000
cd server
cp .env.example .env
npm ci --legacy-peer-deps
npm run seed            # nạp dữ liệu mẫu (kết nối MONGODB_URI, mặc định mongodb://localhost:27017/culture-quest)
npm run start:dev

# Client  ->  http://localhost:5173   (mở terminal khác)
cd client
cp .env.example .env    # VITE_API_BASE_URL trỏ tới server, thêm VITE_GOOGLE_MAPS_API_KEY nếu có
npm ci --legacy-peer-deps
npm run dev
```

### Kiểm thử

```bash
cd server && npm test && npm run test:e2e     # e2e dùng MongoDB tạm trong bộ nhớ (lần đầu tự tải, cần Internet)
cd client && npm test                          # kiểm thử thành phần
cd client && npx playwright install chromium && npm run test:e2e   # kiểm thử trình duyệt, tự bật dev server
```

---

## 5. Vận hành

Trong các lệnh dưới, đặt `dc` là viết tắt cho lệnh compose đầy đủ (Linux/macOS/WSL/Git Bash):

```bash
alias dc='docker compose --env-file .env.production -f docker-compose.prod.yml'
```

| Việc | Lệnh |
| :--- | :--- |
| Xem trạng thái | `dc ps` |
| Xem log | `dc logs -f server` |
| Dừng (giữ dữ liệu) | `dc down` |
| Chạy lại | `dc up -d` |
| Cập nhật mã nguồn mới | thay mã, rồi `dc up -d --build` |
| **Xóa cả dữ liệu** | `dc down -v` (không thể hoàn tác) |

### Sao lưu và khôi phục dữ liệu

```bash
# Sao lưu ra file
dc exec -T mongo mongodump --db culture-quest --archive --gzip > backup.gz

# Khôi phục (ghi đè database hiện tại)
dc exec -T mongo mongorestore --archive --gzip --drop < backup.gz
```

Dùng cặp lệnh này để chuyển dữ liệu sang máy khác. Với PowerShell hãy chạy trong WSL hoặc Git Bash, vì toán tử `>` và `<` ở đó hoạt động khác.

### Xem và sửa dữ liệu bằng MongoDB Compass

Xem [docs/mongodb-compass.md](docs/mongodb-compass.md).

### Quên mật khẩu admin

Xóa tài khoản admin, server sẽ tạo lại bằng `ADMIN_EMAIL`/`ADMIN_PASSWORD` trong `.env.production` khi khởi động lại:

```bash
dc exec -T mongo mongosh --quiet culture-quest --eval 'db.users.deleteOne({email: "admin@culturequest.local"})'
dc restart server
```

---

## 6. Xử lý sự cố

| Triệu chứng | Cách xử lý |
| :--- | :--- |
| `port is already allocated` / cổng 8080 bận | Đổi `WEB_PORT` trong `.env.production`, rồi `dc up -d` |
| `TLS handshake timeout` hoặc không tải được image | Lỗi mạng tới Docker Hub, thử lại; sau proxy công ty thì cấu hình proxy cho Docker |
| `Set JWT_SECRET in .env.production` | Thiếu `--env-file .env.production` trong lệnh, hoặc file chưa có: chạy `bash scripts/setup.sh` |
| Website lên nhưng báo lỗi kết nối API | `dc ps` xem `server` đã `healthy` chưa, rồi `dc logs server` |
| Bản đồ trống/xám | Máy không tải được tile bản đồ (mạng chặn). Với Google Maps thì kiểm tra key và giới hạn domain |
| Không có địa điểm nào | Database trống: chạy lệnh seed ở mục 1 (phần chạy thủ công) |
| Chạy lại `up -d` mà giao diện vẫn cũ | Đã đổi mã hoặc biến `VITE_*` nhưng chưa build lại: thêm `--build` |

---

## 7. Cấu trúc thư mục

```
client/                    React + Vite (nginx.conf: phục vụ web và chuyển /api tới server)
server/                    NestJS (src/database: dữ liệu mẫu và seed)
docker-compose.yml         Chỉ MongoDB, dùng khi phát triển
docker-compose.prod.yml    Toàn bộ hệ thống: mongo + server + client
docker-compose.compass.yml Tùy chọn: mở Mongo của Docker cho Compass (chỉ localhost)
scripts/setup.sh           Cài đặt bằng Docker chỉ một lệnh
scripts/package.sh         Đóng gói để mang sang máy khác
docs/                      Tài liệu bổ sung
```

## 8. Lưu ý bảo mật

- `.env.production` chứa bí mật: **không** commit, không gửi qua chat/email. Gói đóng gói không kèm file này.
- MongoDB trong Docker không có mật khẩu và mặc định **không mở cổng ra ngoài**. Đừng bind cổng 27017 ra `0.0.0.0` hay lên server công khai.
- Đổi `ADMIN_PASSWORD` mặc định nếu dùng file mẫu; `setup.sh` đã tự sinh giá trị ngẫu nhiên.
- Khi đưa lên server công khai nên đặt sau HTTPS (reverse proxy hoặc dịch vụ như Caddy/Traefik). Cấu hình hiện tại chỉ phục vụ HTTP ở cổng `WEB_PORT`.
