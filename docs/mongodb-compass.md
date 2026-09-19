# Quản lý dữ liệu bằng MongoDB Compass

Ứng dụng lưu dữ liệu trong MongoDB, database `culture-quest`. Dùng [MongoDB Compass](https://www.mongodb.com/products/tools/compass) để xem và sửa dữ liệu.

## Chuỗi kết nối

| Môi trường | Connection string |
| :--- | :--- |
| Dev (`server/.env`, hoặc `docker compose up` với `docker-compose.yml`) | `mongodb://127.0.0.1:27017/culture-quest` |
| Docker prod (`docker-compose.prod.yml`) | `mongodb://127.0.0.1:27018/culture-quest` (cần bước dưới) |

Mongo trong Docker prod mặc định **không mở cổng ra máy**. Để Compass kết nối:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.compass.yml up -d mongo
```

Lệnh này chỉ tạo lại container `mongo`, dữ liệu trong volume được giữ nguyên. Cổng chỉ mở trên `127.0.0.1` vì database này không có mật khẩu; **không** mở ra `0.0.0.0` hay lên server công khai. Đổi cổng bằng biến `MONGO_COMPASS_PORT`. Nếu máy đã có Mongo chạy sẵn ở 27017 thì `docker compose up` của `docker-compose.yml` sẽ bị trùng cổng.

## Các collection

| Collection | Nội dung |
| :--- | :--- |
| `users` | Tài khoản. `passwordHash` là bcrypt, không sửa tay. `role`: `player` hoặc `admin` |
| `locations` | Địa điểm, kèm `cultureStory` |
| `challenges` | Thử thách của địa điểm (mỗi địa điểm đúng một), chứa `correctOption` |
| `user_progress` | Tiến độ và XP theo từng người chơi |
| `badges`, `user_badges` | Huy hiệu và huy hiệu người chơi đã nhận |
| `quest_sessions` | Phiên Full/Mini/Explore |

## Lưu ý khi sửa trực tiếp

- Các trường `userId`, `locationId`, `badgeId` phải là kiểu **ObjectId**, không phải chuỗi. Sửa bằng chuỗi sẽ khiến bản ghi không còn khớp với truy vấn của ứng dụng.
- Nội dung (địa điểm, thử thách, huy hiệu) nên quản lý qua trang `/admin` vì trang đó kiểm tra dữ liệu và xóa kèm dữ liệu liên quan. Compass phù hợp để xem, kiểm tra và xử lý sự cố.
- Nạp lại dữ liệu mẫu: `cd server && npm run seed`.
- Cấp quyền admin: đặt `role: "admin"` cho user trong `users`, hoặc dùng `ADMIN_EMAIL`/`ADMIN_PASSWORD` trong `.env` (tạo admin khi server khởi động).
