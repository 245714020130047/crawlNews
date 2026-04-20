# VNNews — Vietnamese News Aggregator with AI Summarization

Nền tảng tổng hợp tin tức tiếng Việt tự động crawl từ 4 nguồn báo lớn, tóm tắt bằng AI (Google Gemini), hiển thị trên giao diện web responsive dựa trên template BizNews.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.3.5, Spring Security (JWT) |
| Frontend | Angular 17 (Standalone Components, Signals) |
| Database | PostgreSQL 16 (JSONB, tsvector FTS) |
| Cache | Redis 7 (Caching + Rate Limiting) |
| Crawling | Jsoup 1.17.2, Rome 2.1.0 (RSS) |
| AI | Google Gemini API (swappable sang OpenAI) |
| DevOps | Docker Compose, Nginx |

## Nguồn tin

| Nguồn | Phương thức |
|-------|-------------|
| VnExpress | RSS + Jsoup HTML scraping |
| Tuổi Trẻ | RSS + Jsoup HTML scraping |
| Thanh Niên | RSS + Jsoup HTML scraping |
| Dân Trí | RSS + Jsoup HTML scraping |

## Cấu trúc dự án

```
crawlNews/
├── backend/                        # Spring Boot REST API
│   └── src/main/java/com/vnnews/
│       ├── config/                 # CacheConfig, RateLimitFilter
│       ├── controller/             # 6 REST controllers
│       ├── dto/                    # Request/Response DTOs
│       ├── entity/                 # 10 JPA entities
│       ├── exception/              # GlobalExceptionHandler
│       ├── repository/             # 10 Spring Data repositories
│       ├── security/               # JWT, UserDetails, SecurityConfig
│       └── service/
│           ├── ai/                 # Gemini/OpenAI summarizers
│           └── crawler/            # 4 source crawlers + scheduler
├── frontend/                       # Angular 17 SPA
│   └── src/app/
│       ├── admin/                  # 7 admin components
│       ├── components/             # 5 shared components
│       ├── guards/                 # Auth + Admin guards
│       ├── interceptors/           # JWT interceptor
│       ├── models/                 # TypeScript interfaces
│       ├── pages/                  # 6 page components
│       └── services/               # 4 Angular services
└── docker-compose.yml              # PostgreSQL + Redis + Backend + Frontend
```

## Tính năng chính

- **Tự động crawl** tin tức từ 4 nguồn mỗi 30 phút (cron có thể chỉnh)
- **AI Summarization** — tóm tắt tự động bằng Gemini, có nút "Tóm tắt bằng AI" cho user
- **Full-text Search** — tìm kiếm tiếng Việt bằng PostgreSQL tsvector
- **3 cấp phân quyền** — ANONYMOUS (đọc), USER (tóm tắt AI), ADMIN (toàn quyền)
- **Rate Limiting** — Bucket4j + Redis, giới hạn theo IP
- **IP Analytics** — theo dõi lượt xem, geolocation (MaxMind GeoIP2)
- **Image Proxy** — proxy ảnh từ nguồn để tránh hotlink blocking
- **Admin Panel** — Dashboard, quản lý bài viết/chuyên mục/user/crawl/scheduler/analytics
- **Responsive UI** — dựa trên BizNews template (Bootstrap 4)

## Yêu cầu hệ thống

- Java 17+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Maven 3.9+ (hoặc dùng Docker)

## Cài đặt & Chạy

### Cách 1: Docker Compose (khuyến nghị)

```bash
# Clone project
cd crawlNews

# Tạo file .env
cp .env.example .env
# Chỉnh sửa GEMINI_API_KEY trong .env

# Chạy toàn bộ
docker-compose up -d

# Truy cập:
# Frontend: http://localhost
# Backend API: http://localhost:8080/api
```

### Cách 2: Chạy thủ công

#### 1. Database

```bash
# Khởi động PostgreSQL và Redis
docker run -d --name vnnews-db -p 5432:5432 \
  -e POSTGRES_DB=vnnews -e POSTGRES_USER=vnnews -e POSTGRES_PASSWORD=vnnews_secret \
  postgres:16-alpine

docker run -d --name vnnews-redis -p 6379:6379 redis:7-alpine
```

#### 2. Backend

```bash
cd backend

# Cấu hình (tạo file hoặc set biến môi trường)
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/vnnews
export SPRING_DATASOURCE_USERNAME=vnnews
export SPRING_DATASOURCE_PASSWORD=vnnews_secret
export SPRING_DATA_REDIS_HOST=localhost
export JWT_SECRET=your-256-bit-secret-key
export GEMINI_API_KEY=your-gemini-api-key

# Build & Run
mvn clean package -DskipTests
java -jar target/*.jar

# API chạy tại http://localhost:8080
```

#### 3. Frontend

```bash
cd frontend

# Cài dependencies
npm install

# Development
npm start
# Truy cập http://localhost:4200

# Production build
npm run build
# Output tại dist/vnnews-frontend/
```

## Tài khoản mặc định

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |

> **Lưu ý:** Đổi mật khẩu ngay sau lần đăng nhập đầu tiên.

## API Endpoints chính

### Public

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/articles` | Danh sách bài viết (phân trang) |
| GET | `/api/articles/{slug}` | Chi tiết bài viết |
| GET | `/api/articles/search?q=` | Tìm kiếm full-text |
| GET | `/api/articles/trending` | Bài viết xu hướng |
| GET | `/api/categories` | Danh sách chuyên mục |
| GET | `/api/categories/{slug}/articles` | Bài theo chuyên mục |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/register` | Đăng ký |

### User (cần đăng nhập)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/articles/{id}/summarize` | Tóm tắt bằng AI |

### Admin

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/dashboard` | Thống kê tổng quan |
| CRUD | `/api/admin/articles` | Quản lý bài viết |
| CRUD | `/api/admin/categories` | Quản lý chuyên mục |
| CRUD | `/api/admin/users` | Quản lý người dùng |
| PUT | `/api/admin/schedulers/{id}/toggle` | Bật/tắt scheduler |
| POST | `/api/admin/crawl/trigger` | Chạy crawl thủ công |
| GET | `/api/admin/analytics` | Thống kê truy cập |
| CRUD | `/api/admin/ip-blacklist` | Quản lý IP bị chặn |

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL | `jdbc:postgresql://localhost:5432/vnnews` |
| `SPRING_DATASOURCE_USERNAME` | DB username | `vnnews` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | `vnnews_secret` |
| `SPRING_DATA_REDIS_HOST` | Redis host | `localhost` |
| `JWT_SECRET` | Secret key cho JWT | — |
| `GEMINI_API_KEY` | Google Gemini API key | — |

## Database Migrations

Flyway tự động chạy khi backend khởi động:

| Migration | Mô tả |
|-----------|-------|
| V1 | Tạo tables + indexes + tsvector |
| V2 | Seed 12 chuyên mục tiếng Việt |
| V3 | Seed 4 crawl configs (VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí) |
| V4 | Seed category mappings |
| V5 | Seed admin user mặc định |
| V6 | Seed scheduler + AI configs |

## License

MIT
