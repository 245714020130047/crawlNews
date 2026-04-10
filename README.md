# CrawlNews

Nền tảng tổng hợp và tóm tắt tin tức tự động từ các báo lớn của Việt Nam (VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí, Kênh 14) sử dụng **Spring Boot 3.4 + Angular 19 + AI (Gemini / OpenAI)**.

---

## Tính năng chính

| Tính năng | Mô tả |
|---|---|
| **Crawl tự động** | Lên lịch crawl theo cron, hỗ trợ 5 nguồn báo, chiến lược adapter |
| **Dedup thông minh** | 3 lớp trùng lặp: canonical URL → normalized URL → content fingerprint |
| **AI Tóm tắt** | Tóm tắt bằng Gemini hoặc OpenAI, hàng đợi async, retry tự động |
| **Robots.txt** | Tuân thủ robots.txt, cache Redis, không crawl đường dẫn bị cấm |
| **Dashboard admin** | Biểu đồ crawl hàng ngày, sức khỏe nguồn báo, thống kê AI |
| **Logging cấu trúc** | JSON log (Logstash encoder), file riêng cho crawler và summary, MDC context |
| **API Swagger** | Tài liệu API tại `/swagger-ui.html` |

---

## Kiến trúc

```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐
│  Angular 19     │◄──────────────────►│  Spring Boot    │
│  (Tailwind CSS  │                    │  3.4 / Java 21  │
│   PrimeNG 17)   │                    │                 │
└─────────────────┘                    └────────┬────────┘
                                                │
                              ┌─────────────────┼──────────────────┐
                              ▼                 ▼                  ▼
                        PostgreSQL 16       Redis 7          AI (Gemini)
                        (Flyway migration)  (dedup cache,    (summary API)
                                            robots cache)
```

---

## Yêu cầu

- **Docker** ≥ 24 & **Docker Compose** ≥ 2.20
- *(Chạy local không Docker)*: Java 21, Maven 3.9+, Node.js 20+, PostgreSQL 16, Redis 7

---

## Chạy nhanh bằng Docker Compose

### 1. Clone và cấu hình

```bash
git clone <repo-url>
cd crawlNews
cp .env.example .env
```

Mở `.env` và điền các giá trị (xem phần [Biến môi trường](#biến-môi-trường)).

### 2. Khởi động

```bash
docker compose up -d
```

Lần đầu sẽ mất ~3–5 phút để build image và chạy Flyway migration.

### 3. Kiểm tra

| Dịch vụ | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Actuator health | http://localhost:8080/actuator/health |

### 4. Dừng

```bash
docker compose down          # giữ dữ liệu
docker compose down -v       # xóa cả volumes (reset DB)
```

---

## Chạy local (development)

### Backend

```bash
# Yêu cầu: PostgreSQL và Redis đang chạy
cd backend
cp src/main/resources/application-dev.yml.example src/main/resources/application-dev.yml  # nếu có
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Backend chạy tại `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm start          # proxy /api → localhost:8080
```

Frontend chạy tại `http://localhost:4200`.

---

## Biến môi trường

Tất cả biến được định nghĩa trong `.env` (copy từ `.env.example`).

| Biến | Mặc định | Mô tả |
|---|---|---|
| `POSTGRES_DB` | `crawlnews` | Tên database |
| `POSTGRES_USER` | `crawlnews` | Tên user PostgreSQL |
| `POSTGRES_PASSWORD` | — | **Bắt buộc thay đổi** |
| `APP_JWT_SECRET` | — | Secret JWT, tối thiểu 32 ký tự |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | Các origin cho phép |
| `AI_PROVIDER` | `GEMINI` | Nhà cung cấp AI (`GEMINI` hoặc `OPENAI`) |
| `AI_API_KEY` | — | API key của Gemini/OpenAI |
| `AI_MODEL` | `gemini-2.0-flash` | Model sử dụng |
| `AI_BASE_URL` | Gemini endpoint | Base URL của API |
| `BACKEND_PORT` | `8080` | Port expose backend |
| `FRONTEND_PORT` | `4200` | Port expose frontend |

---

## Cấu trúc dự án

```
crawlNews/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/crawlnews/backend/
│   │   ├── config/             # SecurityConfig, WebConfig, RedisConfig...
│   │   ├── crawler/            # Adapter pattern + Pipeline + Scheduler
│   │   ├── domain/             # JPA Entities + Enums
│   │   ├── repository/         # Spring Data JPA repositories
│   │   ├── service/            # Business logic
│   │   └── web/                # REST Controllers (public + admin)
│   └── src/main/resources/
│       ├── application.yml     # Main config
│       ├── application-dev.yml # Dev overrides
│       ├── logback-spring.xml  # JSON structured logging
│       └── db/migration/       # Flyway V1 schema, V2 seed, V3 views
├── frontend/                   # Angular 19 application
│   └── src/app/
│       ├── core/               # Services + Interceptors
│       ├── features/           # home, news, dashboard, admin-*
│       ├── models/             # TypeScript interfaces
│       └── app.routes.ts       # Lazy-loaded routes
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## API chính

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/public/home` | Dữ liệu trang chủ |
| GET | `/api/public/articles` | Danh sách bài viết (phân trang) |
| GET | `/api/public/articles/{id}` | Chi tiết bài viết |
| POST | `/api/public/articles/{id}/summarize` | Yêu cầu tóm tắt AI |
| GET | `/api/admin/dashboard/overview` | Tổng quan hệ thống |
| GET | `/api/admin/crawl-jobs` | Lịch sử crawl |
| GET | `/api/admin/sources` | Quản lý nguồn báo |
| POST | `/api/admin/sources/{id}/crawl` | Crawl thủ công |
| GET | `/api/admin/summaries/jobs` | Hàng đợi AI summary |
| PUT | `/api/admin/summaries/settings` | Cấu hình AI summary |

---

## Logs

```bash
# Xem log backend realtime
docker compose logs -f backend

# Hoặc xem file log (mount ra ./logs/)
tail -f logs/crawlnews-dev.json   # JSON structured
tail -f logs/crawler.log          # Crawler chuyên dụng
tail -f logs/summary.log          # AI summary chuyên dụng
```

---

## Lưu ý bảo mật

- Không commit file `.env`
- Đổi `POSTGRES_PASSWORD` và `APP_JWT_SECRET` trước khi deploy
- Admin endpoints hiện `permitAll()` – cần bật JWT filter cho production
