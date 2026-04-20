# Plan: Vietnamese News Aggregator with AI Summarization

## TL;DR
Build a full-stack Vietnamese news aggregation platform that crawls articles from VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí, summarizes them via Google Gemini API (swappable), and displays on a responsive UI based on the BizNews template. Includes admin panel, JWT auth, Redis caching, Docker Compose deployment targeting AWS Free Tier.

**Tech Stack:** Java 17 · Spring Boot 3.3.5 · Angular 17 · PostgreSQL 16 (JSONB) · Redis 7 · Docker Compose · GitHub Actions CI/CD · AWS Free Tier

---

## Phase 1: Project Scaffolding & Infrastructure

### Step 1.1 — Monorepo Structure
```
vn-news-aggregator/
├── backend/                    # Spring Boot 3.3.5
│   ├── src/main/java/com/vnnews/
│   │   ├── config/             # Security, Redis, CORS, Scheduler configs
│   │   ├── controller/         # REST controllers
│   │   ├── dto/                # Request/Response DTOs
│   │   ├── entity/             # JPA entities
│   │   ├── repository/         # Spring Data JPA repos
│   │   ├── service/            # Business logic
│   │   ├── crawler/            # Crawl services per source
│   │   ├── ai/                 # AI summarization abstraction
│   │   ├── security/           # JWT filter, auth provider
│   │   └── scheduler/          # Cron jobs for crawling
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/       # Flyway migrations
├── frontend/                   # Angular 17
│   └── src/
│       ├── app/
│       │   ├── core/           # Guards, interceptors, services
│       │   ├── shared/         # Shared components, pipes
│       │   ├── features/       # Feature modules
│       │   │   ├── home/
│       │   │   ├── category/
│       │   │   ├── article/
│       │   │   ├── auth/
│       │   │   └── admin/
│       │   └── layout/         # Header, footer, sidebar
│       ├── assets/             # Images, fonts from template
│       └── environments/
├── docker-compose.yml
├── .github/workflows/          # CI/CD
└── README.md
```

### Step 1.2 — Docker Compose Setup
- PostgreSQL 16 container (port 5432)
- Redis 7 container (port 6379)
- Spring Boot app container (port 8080)
- Angular dev server / Nginx container (port 4200/80)
- Volumes for persistent data

### Step 1.3 — Database Schema (PostgreSQL + JSONB)

**Tables:**
- `users` — id, username, email, password_hash, role (ADMIN/USER), created_at, updated_at
- `scheduler_configs` — id, job_name (CRAWL/SUMMARIZATION), enabled, cron_expression, updated_by, updated_at
- `categories` — id, name, slug, description, parent_id, sort_order, active, auto_created (boolean, true if created by crawler)
- `category_mappings` — id, source_name, source_category (text from RSS/HTML), category_id (FK → categories), created_at. Unique constraint on (source_name, source_category)
- `articles` — id, title, slug, summary (AI-generated), content, thumbnail_url, source_url, source_name, category_id, published_at, created_at, updated_at, status (DRAFT/PUBLISHED/ARCHIVED), view_count, **metadata JSONB** (original_tags, crawl_info, ai_model_used, original_author, extra_images[])
- `crawl_configs` — id, source_name, base_url, rss_url, selectors JSONB (title, content, thumbnail, category CSS selectors), active, crawl_interval_minutes
- `crawl_logs` — id, crawl_config_id, started_at, finished_at, articles_found, articles_saved, errors JSONB, status
- `ai_configs` — id, provider (GEMINI/OPENAI), api_key_encrypted, model_name, max_tokens, temperature, active, prompt_template
- `article_views` — id, article_id (FK), ip_address (inet), user_agent, city, region, country, **geo_data JSONB** (lat, lon, isp), viewed_at, user_id (FK nullable). Index on (article_id, ip_address, viewed_at) for dedup within time window
- `ip_blacklist` — id, ip_address (inet), reason, blocked_at, blocked_until, created_by

**JSONB Usage:**
- `articles.metadata` — flexible fields per source (tags, author, images, crawl timestamp)
- `crawl_configs.selectors` — CSS selectors vary per source
- `crawl_logs.errors` — structured error list
- `article_views.geo_data` — IP geolocation details (lat, lon, ISP, timezone)
- Flyway for migrations

### Step 1.4 — Flyway Migrations
- V1__init_schema.sql — create all tables
- V2__seed_categories.sql — Vietnamese news categories (Thời sự, Kinh doanh, Thể thao, Giải trí, Công nghệ, Giáo dục, Sức khỏe, Đời sống)
- V3__seed_crawl_configs.sql — default configs for 4 sources
- V4__seed_category_mappings.sql — map known source categories to internal categories (e.g. VnExpress "the-gioi" → Thời sự, "kinh-doanh" → Kinh doanh)
- V5__seed_admin_user.sql — default admin account
- V6__seed_scheduler_configs.sql — default scheduler configs (crawl + summarization, both enabled)

---

## Phase 2: Backend Core (Spring Boot)

### Step 2.1 — Spring Security + JWT Authentication
- `JwtTokenProvider` — generate/validate tokens (access 15min, refresh 7d)
- `JwtAuthenticationFilter` — OncePerRequestFilter, extract token from Authorization header
- `SecurityConfig` — configure CORS, CSRF disabled, stateless session, permit public endpoints
- Endpoints: POST `/api/auth/login`, POST `/api/auth/register`, POST `/api/auth/refresh`
- Roles: ADMIN, USER, ANONYMOUS (no login)

**Access control matrix:**

| Resource | ANONYMOUS | USER | ADMIN |
|----------|-----------|------|-------|
| View articles, categories, search | ✅ | ✅ | ✅ |
| View single article detail | ✅ | ✅ | ✅ |
| Comment on articles | ❌ | ✅ | ✅ |
| Save/bookmark articles | ❌ | ✅ | ✅ |
| Manual "Tóm tắt bằng AI" button | ✅ | ✅ | ✅ |
| Admin panel (CRUD, dashboard, configs) | ❌ | ❌ | ✅ |
| Toggle schedulers (crawl/summarization) | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

### Step 2.2 — API Rate Limiting (Public APIs only)
- **Bucket4j + Redis** for distributed rate limiting
- Limits per IP: 60 requests/min for article listing, 30 requests/min for search, 10 requests/min for AI summarize
- `RateLimitFilter` — OncePerRequestFilter, check Redis counter per IP + endpoint
- Return `429 Too Many Requests` with `Retry-After` header
- Blocked IPs from `ip_blacklist` table → immediate `403 Forbidden`
- Admin can manage blacklist from admin panel

### Step 2.3 — IP Tracking & Analytics
- `ArticleViewService` — on `GET /api/articles/{slug}`, log to `article_views` table
- Deduplicate: same IP + same article within 30 min window → don't count twice
- IP geolocation: use free MaxMind GeoLite2 DB (bundled, no external API call) → resolve city/region/country
- Store user_id if logged in (nullable FK)
- `GET /api/admin/analytics/views` — views by day, by region, by source (ADMIN only)
- `GET /api/admin/analytics/geo` — geographic breakdown of readers (ADMIN only)
- **Security:** Auto-detect suspicious patterns (>100 req/min from single IP) → alert in admin dashboard, option to auto-blacklist

### Step 2.4 — Article & Category REST APIs
- `GET /api/articles` — paginated, filterable by category/source/date (public)
- `GET /api/articles/{slug}` — single article detail (public, increment view_count)
- `GET /api/articles/search?q=` — full-text search (public)
- `GET /api/categories` — list all active categories (public)
- `GET /api/categories/{slug}/articles` — articles by category (public)
- Redis caching: cache article lists (TTL 5min), category list (TTL 1h), invalidate on new crawl

### Step 2.5 — Admin REST APIs (ADMIN role only)
- CRUD `/api/admin/articles` — create/update/delete/change status
- CRUD `/api/admin/categories` — manage categories (includes filter by auto_created)
- CRUD `/api/admin/category-mappings` — manage source→internal category mappings
- CRUD `/api/admin/users` — manage users, change roles
- `GET /api/admin/dashboard` — stats (total articles, views today, crawl status, source breakdown)
- `GET /api/admin/analytics/views` — views by day/region/source
- `GET /api/admin/analytics/geo` — geographic reader breakdown
- CRUD `/api/admin/ip-blacklist` — manage blocked IPs
- CRUD `/api/admin/crawl-configs` — manage crawl sources & selectors
- POST `/api/admin/crawl/{sourceId}/trigger` — manual crawl trigger
- CRUD `/api/admin/ai-configs` — manage AI provider settings
- **Scheduler control:**
  - `GET /api/admin/schedulers` — list all scheduler configs (crawl, summarization)
  - `PUT /api/admin/schedulers/{jobName}/toggle` — enable/disable scheduler
  - `PUT /api/admin/schedulers/{jobName}/cron` — update cron expression
- **Manual summarization:**
  - `POST /api/articles/{id}/summarize` — trigger AI summary for a single article (USER + ADMIN)

---

## Phase 3: Web Crawling Engine

### Step 3.1 — Crawler Architecture
- **Strategy Pattern:** `NewsCrawler` interface → `VnExpressCrawler`, `TuoiTreCrawler`, `ThanhNienCrawler`, `DanTriCrawler`
- **Dual approach per source:**
  1. RSS feed parsing (Jsoup/Rome library) for new article discovery
  2. HTML scraping (Jsoup) for full content extraction
- **Scheduler:** `@Scheduled` cron (configurable per source, default every 30 min). Admin can enable/disable crawl scheduler globally from admin panel via `scheduler_configs` table
- **Deduplication:** check source_url uniqueness before saving

### Step 3.2 — Source-Specific Crawlers

| Source | RSS URL | Content Strategy |
|--------|---------|-----------------|
| VnExpress | vnexpress.net/rss/*.rss | RSS discovery → Jsoup scrape article page |
| Tuổi Trẻ | tuoitre.vn/rss/*.rss | RSS discovery → Jsoup scrape |
| Thanh Niên | thanhnien.vn/rss/*.rss | RSS discovery → Jsoup scrape |
| Dân Trí | dantri.com.vn/rss/*.rss | RSS discovery → Jsoup scrape |

- CSS selectors stored in `crawl_configs.selectors` JSONB — admin can update without code changes
- Extract: title, content (cleaned HTML), thumbnail, published date, category mapping, author
- Store original data in `articles.metadata` JSONB

### Step 3.3 — Category Resolution Pipeline
- On crawl, each article has a `source_category` string (e.g. "kinh-doanh", "the-thao", "giao-duc")
- **Step 1:** Look up `category_mappings` table for (source_name, source_category) → get internal category_id
- **Step 2:** If mapping exists → use mapped category_id
- **Step 3:** If no mapping found → auto-create new category (name = source_category, slug = slugify, auto_created = true) → create mapping → assign to article
- Admin can later review auto-created categories (filter by `auto_created = true`), rename/merge/remap them
- Admin panel: "Category Mappings" tab → table of source_name + source_category + mapped internal category → editable dropdown to remap

### Step 3.4 — Crawl Pipeline
1. Fetch RSS → parse items
2. Filter duplicates (by source_url)
3. For each new item: fetch full page → extract content using selectors
4. Resolve category via Category Resolution Pipeline (Step 3.3)
5. Queue for AI summarization
6. Save article (status=DRAFT until summary complete)
7. Log results to `crawl_logs`

---

## Phase 4: AI Summarization

### Step 4.1 — AI Provider Abstraction
- **Interface:** `AiSummarizer` with method `summarize(String content, String language): String`
- **Implementations:**
  - `GeminiSummarizer` — Google Gemini API (default, primary)
  - `OpenAiSummarizer` — OpenAI GPT API (future swap)
- **Factory:** `AiSummarizerFactory` — select active provider from `ai_configs` table
- Config stored in DB → switchable from admin panel without redeployment

### Step 4.2 — Summarization Flow
- **Automatic (Scheduler):** After crawl completes, scheduler picks unsummarized articles → summarize in batch → update status DRAFT → PUBLISHED. Admin can enable/disable this scheduler from admin panel
- **Manual (User/Admin):** Button "Tóm tắt bằng AI" on Single article page → calls `POST /api/articles/{id}/summarize` → returns summary in real-time → saves to article. Available for logged-in users (USER + ADMIN)
- Prompt template (Vietnamese): "Tóm tắt bài viết sau bằng tiếng Việt trong 2-3 câu ngắn gọn, giữ nguyên các thông tin quan trọng: {content}"
- Async processing: `@Async` for batch scheduler mode (default false); synchronous for manual single-article mode
- Rate limiting: respect API quotas (Gemini free tier: 15 RPM)
- Fallback: if AI fails, use first 200 chars of content as summary
- Store AI model used in `articles.metadata.ai_model_used`

---

## Phase 5: Frontend (Angular 17)

### Step 5.1 — Template Migration & Modifications

**From BizNews template → Angular components:**

| Template Section | Angular Component | Changes |
|-----------------|-------------------|---------|
| Topbar | REMOVED entirely | Delete Topbar End section |
| Navbar | `HeaderComponent` | Move social icons + login button here; Add sticky header |
| Main Slider | `HeroCarouselComponent` | Dynamic data from API |
| Breaking News | `BreakingNewsComponent` | Real-time latest articles |
| Featured News | `FeaturedNewsComponent` | Owl Carousel → Angular carousel |
| Latest News | `LatestNewsComponent` | Paginated article grid |
| Sidebar | `SidebarComponent` | REMOVE "Follow Us" & "Advertisement"; Keep Trending, Newsletter, Tags |
| Footer | `FooterComponent` | Keep as-is, update links |
| Category page | `CategoryComponent` | category.html → dynamic |
| Single article | `ArticleDetailComponent` | single.html → dynamic; Add "Tóm tắt bằng AI" button (USER + ADMIN) |
| Contact | `ContactComponent` | contact.html → dynamic |

**Specific Template Changes:**
1. **Remove Topbar End** — Delete the entire `<!-- Topbar End -->` section (date, advertise/contact/login links, social icons row + the ad banner below)
2. **Move to Navbar Start:** Social media icons (fab fa-twitter, fa-facebook-f, etc.) + Login link → place in navbar-nav at the beginning, before navigation links
3. **Remove "Follow Us"** — Delete sidebar social buttons section from all pages
4. **Remove "Advertisement"** — Delete sidebar ad image section from all pages
5. **Sticky Header** — Add CSS `position: sticky; top: 0; z-index: 1030;` to navbar + JS scroll class toggle for shadow effect

### Step 5.2 — Sticky Header Implementation
- CSS: `.navbar { position: sticky; top: 0; z-index: 1030; transition: box-shadow 0.3s; }`
- On scroll > 50px: add `.navbar-scrolled { box-shadow: 0 2px 10px rgba(0,0,0,0.15); }`
- Angular: `@HostListener('window:scroll')` in HeaderComponent

### Step 5.3 — Core Angular Architecture
- **Standalone components** (Angular 17 style)
- **Lazy-loaded routes:** home, category/:slug, article/:slug, contact, auth/login, admin/*
- **Services:** ArticleService, CategoryService, AuthService, AdminService
- **Interceptors:** JwtInterceptor (attach token), ErrorInterceptor (handle 401 → redirect login)
- **Guards:** AuthGuard (logged in), AdminGuard (ADMIN role)
- **State:** Angular Signals for reactive state management (Angular 17 feature)
- **SSR consideration:** Optional Angular SSR for SEO (future enhancement)

### Step 5.4 — Admin Panel (Angular)
- Route: `/admin/*` (protected by AdminGuard)
- **Dashboard:** Stats cards (total articles, views today, active crawlers, last crawl time) + charts (articles per day, views per category)
- **Article Management:** DataTable with search/filter/sort, inline status toggle, edit form
- **Category Management:** Tree view for parent/child categories, drag-and-drop sort. Filter `auto_created` to review crawler-generated categories
- **Category Mappings:** Table of source → source_category → internal category. Editable dropdown to remap. Bulk actions for unmapped categories
- **User Management:** User list with role toggle (USER ↔ ADMIN)
- **IP Analytics:** Views by region (map visualization), top cities, reader geo breakdown. IP blacklist management (add/remove/auto-detect)
- **Crawl Config:** Source list with enable/disable, selector editor, manual trigger button
- **Scheduler Control:** Toggle switches for Crawl scheduler and Summarization scheduler (on/off), cron expression editor, last run status
- **AI Config:** Provider selector, API key input, prompt template editor
- UI: Reuse BizNews dark theme + Bootstrap for admin layout

### Step 5.5 — Vietnamese UI (i18n-ready)
- All UI labels in Vietnamese (Trang chủ, Danh mục, Tin mới nhất, Đăng nhập, etc.)
- Date formatting: Vietnamese locale (`vi`)
- No i18n framework needed now, but structure allows future addition

---

## Phase 6: DevOps & Deployment

### Step 6.1 — Docker Compose (docker-compose.yml)
```yaml
services:
  db: postgres:16-alpine (5432)
  redis: redis:7-alpine (6379)
  backend: custom Dockerfile (multi-stage build, JDK 17)
  frontend: Nginx serving Angular build
```
- Environment variables for secrets (DB password, JWT secret, Gemini API key)
- Health checks for all services

### Step 6.2 — GitHub Actions CI/CD
- **CI Pipeline (.github/workflows/ci.yml):**
  - On push/PR to main
  - Backend: `./mvnw test` → build JAR
  - Frontend: `ng test` → `ng build --prod`
  - Docker build & push to registry

- **CD Pipeline (.github/workflows/deploy.yml):**
  - On merge to main
  - SSH into AWS EC2 → docker compose pull → docker compose up -d
  - Health check after deploy

### Step 6.3 — AWS Free Tier Setup
- EC2 t2.micro (1GB RAM) — run Docker Compose
- RDS Free Tier (PostgreSQL) or run Postgres in Docker
- ElastiCache Free Tier (Redis) or run Redis in Docker
- S3 for image storage (optional, crawled thumbnails)
- Route53 for domain (optional)
- **Recommendation:** Run everything in Docker on EC2 to stay within free tier

---

## Relevant Files (Template Reference)

- `news/index.html` — Main page layout, carousel structure, sidebar structure to replicate
- `news/category.html` — Category page layout with article grid
- `news/single.html` — Article detail page with comments section
- `news/contact.html` — Contact form layout
- `news/js/main.js` — Owl Carousel init, back-to-top, dropdown hover logic to port to Angular
- `news/css/style.css` — All custom styles to migrate
- `news/scss/style.scss` — SCSS source (primary: #24d7f7, secondary: #31404B, dark: #1E2024, body bg: #EDEFF4)
- `news/lib/owlcarousel/` — Replace with Angular carousel library (ngx-owl-carousel-o or swiper)

---

## Verification

1. **Docker Compose:** `docker compose up` → all 4 services healthy, frontend accessible at localhost:80
2. **Auth:** Register → Login → receive JWT → access protected endpoints → 401 on expired token
3. **Crawl:** Trigger manual crawl for VnExpress → articles appear in DB with metadata JSONB → summary generated by Gemini
4. **Frontend:** Home page loads with real crawled articles, carousel works, sticky header works on scroll, no Follow Us / Advertisement / Topbar visible
5. **Admin:** Login as admin → dashboard shows stats → CRUD articles → change crawl config → trigger crawl
6. **CI/CD:** Push to GitHub → Actions run tests → build Docker images → deploy to AWS
7. **Redis:** Second request to `/api/articles` returns cached response (check response time < 10ms)
8. **Responsive:** Test on mobile (375px), tablet (768px), desktop (1200px+)

---

## Decisions

- **Gemini API as primary AI provider** — with abstraction layer for easy swap to OpenAI
- **Remove Topbar entirely** — social icons + login moved to Navbar
- **JSONB for flexible metadata** — avoids schema changes when adding crawl fields per source
- **Flyway for migrations** — version-controlled schema
- **JWT stateless auth** — no session management needed, works with Redis for token blacklist on logout
- **Owl Carousel → ngx-owl-carousel-o** — Angular-compatible wrapper for same library
- **Vietnamese UI** — no i18n framework, hardcoded Vietnamese labels (expandable later)
- **All services in Docker on single EC2** — simplest AWS Free Tier deployment
- **Full-text search:** PostgreSQL `tsvector` for v1, upgrade to Elasticsearch later if needed
- **Image proxy:** Proxy thumbnails through backend with caching (avoid hotlinking from source — prevents broken images)

## Further Considerations

1. **WebSocket for real-time:** Add WebSocket push for breaking news notifications? Recommendation: Skip for v1, add in future iteration.
