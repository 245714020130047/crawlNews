## Plan: Nền tảng Crawl Tin Tức Việt Nam

Xây dựng hệ thống 2 lớp Angular + Spring Boot cho bài toán crawl tin tức từ VnExpress, Tuoi Tre, Thanh Nien, Dan Tri, kenh14.vn với chu kỳ 30-60 phút, tuân thủ robots.txt theo từng nguồn, quản lý vòng đời crawl data, dùng Redis cho cache và tối ưu vận hành, lưu nội dung bài viết + metadata + link gốc vào PostgreSQL, và bổ sung AI summarize news theo cơ chế manual-first, có thể bật/tắt tự động bằng cấu hình, để hỗ trợ hiển thị/tóm tắt nhanh trên home, detail, dashboard và trang quản trị.

**Steps**
1. Phase 1 - Khởi tạo kiến trúc nền (blocking)
1. Tạo 2 project độc lập: `frontend` (Angular) và `backend` (Spring Boot).
2. Chuẩn hóa môi trường local bằng Docker Compose cho PostgreSQL + Redis và profile `dev` cho backend.
3. Thiết lập cấu hình chung: timezone `Asia/Ho_Chi_Minh`, encoding UTF-8, logging chuẩn JSON/text, CORS giữa Angular và backend.

1. Phase 2 - Thiết kế dữ liệu & domain backend (depends on Phase 1)
1. Thiết kế schema chính: `news_source`, `news_article`, `crawl_job`, `crawl_result`, `crawl_raw_snapshot` (tuỳ chọn), `news_summary`, `summary_job`, `article_category` (nếu cần mapping nhiều-nhiều).
2. Quy định unique/duplicate rule: ưu tiên `canonical_url` + fallback theo hash(title + published_at + source).
3. Tạo migration ban đầu (Flyway/Liquibase), seed dữ liệu nguồn crawl mặc định (5 nguồn đã chốt).
4. Cài đặt lớp domain/service/repository và DTO cho API trả dữ liệu phân trang.

1. Phase 3 - Crawler engine Spring Boot (depends on Phase 2)
1. Xây dựng crawler adapter theo nguồn (strategy pattern): mỗi nguồn có parser riêng cho list + detail.
2. Tạo scheduler chạy 30-60 phút bằng `@Scheduled` + ShedLock để tránh chạy chồng job giữa nhiều instance.
3. Dùng Jsoup-first cho phần lớn nguồn tĩnh, chỉ fallback sang Playwright cho nguồn/trang detail render động bằng JavaScript.
4. Thêm retry/backoff, timeout, user-agent rotation cơ bản, theo dõi lỗi theo nguồn, và giới hạn concurrency bằng thread pool riêng cho crawler.
5. Dùng Redis cho cache robots.txt, cache homepage/query nóng, cache source health ngắn hạn, và rate-limit cho thao tác admin.
6. Thực thi legal guard: tải và cache robots.txt theo domain, chỉ crawl các path được phép, lưu dấu vết quyết định allow/disallow theo mỗi crawl job.
7. Thêm quản lý crawl data: lưu snapshot raw (tuỳ chọn), chuẩn hóa parser version, chính sách retention/archiving, và cơ chế re-crawl theo bài lỗi hoặc bài hot.
8. Chuẩn hóa dữ liệu lưu nội dung + metadata + link gốc: title, summary, content_html/content_text, author, category, tags, image, published_at, crawl_at, source_url, canonical_url.
9. Thiết kế pipeline: kiểm tra robots -> fetch list -> lọc trùng -> fetch detail -> parse -> persist -> ghi log kết quả.

1. Phase 4 - Public API + Admin API + AI Summarize (depends on Phase 2/3)
1. Public API đầy đủ: `GET /api/public/home`, `GET /api/public/articles`, `GET /api/public/articles/{id-or-slug}`, `GET /api/public/sources`, `GET /api/public/categories`, `GET /api/public/categories/{slug}` (danh sách bài theo category), `GET /api/public/trending`, `GET /api/public/search/suggestions`.
2. Dashboard API đầy đủ: `GET /api/admin/dashboard/overview`, `GET /api/admin/dashboard/crawl-metrics`, `GET /api/admin/dashboard/summary-metrics`, `GET /api/admin/dashboard/source-health`.
3. Summary API: `GET /api/public/articles/{id}/summary`, `POST /api/public/articles/{id}/summarize`, `POST /api/admin/summaries/jobs`, `GET /api/admin/summaries/jobs`, `POST /api/admin/summaries/{articleId}/retry`, `PUT /api/admin/summaries/{articleId}`, `GET /api/admin/settings/summary`, `PUT /api/admin/settings/summary`.
4. AI summarize chạy bất đồng bộ theo `summary_job` queue trong PostgreSQL: mặc định `auto-summary = OFF`, chỉ enqueue tự động khi admin bật cấu hình; ngoài ra người dùng/admin có thể bấm nút summarize ngay trong trang bài viết để tạo job thủ công.
5. Admin Sources API: `GET/POST/PUT /api/admin/sources`, `POST /api/admin/sources/{id}/enable`, `POST /api/admin/sources/{id}/disable`, `POST /api/admin/sources/{id}/crawl`.
5b. Admin Categories API: `GET /api/admin/categories`, `POST /api/admin/categories`, `PUT /api/admin/categories/{id}`, `DELETE /api/admin/categories/{id}` (chỉ khi không có bài nào tham chiếu), `PATCH /api/admin/categories/{id}/toggle`, `PATCH /api/admin/categories/{id}/reorder`.
6. Admin Crawl Data API: `GET /api/admin/crawl-jobs`, `GET /api/admin/crawl-jobs/{id}`, `POST /api/admin/crawl-jobs/retry`, `POST /api/admin/crawl-jobs/run-all`, `POST /api/admin/articles/reindex`, `DELETE /api/admin/crawl-raw-snapshots` theo retention policy.
7. Admin Articles API: `GET /api/admin/articles`, `GET /api/admin/articles/{id}`, `POST /api/admin/articles/{id}/re-crawl`, `POST /api/admin/articles/{id}/deduplicate`, `PATCH /api/admin/articles/{id}/status`.
8. Bổ sung OpenAPI/Swagger, chuẩn error response, pagination/filter/sort nhất quán cho mọi endpoint list.

1. Phase 5 - Angular app (parallel with late Phase 4 once API contract ổn định)
1. Cấu trúc app theo feature modules: Home, NewsList, NewsDetail, NewsCategory, SearchFilter, Dashboard, AdminSources, AdminCategories, AdminCrawlData, AdminSummaries.
2. Tạo service gọi API, state quản lý bằng RxJS (hoặc NgRx nếu dữ liệu dashboard/summarize phức tạp).
3. UI public side dùng template tin tức tự xây dựng trên Tailwind CSS: news card, hero banner, feed strip, source badge, category chips — không dùng UI framework nặng ở public side để giữ bundle nhỏ và UX nhanh.
4. Trang Home hiển thị tin mới + nhóm theo nguồn/chuyên mục + AI summary ngắn nếu đã có summary.
5. Trang List + Search/Filter hỗ trợ phân trang server-side, debounce tìm kiếm.
6. Trang Category (`/categories/:slug`): tiêu đề chuyên mục, mô tả, danh sách bài phân trang, breadcrumb, sidebar top tags.
7. Trang Detail render nội dung bài viết (sanitize HTML), hiển thị metadata nguồn/thời gian + summary và trạng thái summarize; có nút `AI Summarize` để tạo summary thủ công cho bài hiện tại.
8. Dashboard hiển thị biểu đồ crawl, tình trạng nguồn, tỉ lệ bài đã summarize, và trạng thái auto-summary đang bật/tắt.
9. Admin Sources cho phép thêm/sửa/bật tắt nguồn và trigger crawl thủ công.
10. Admin Categories cho phép CRUD chuyên mục, thiết lập cây 2 cấp, sắp xếp thứ tự hiển thị, bật/tắt chuyên mục.
11. Admin Crawl Data cho phép xem job, lọc theo trạng thái lỗi, trigger re-crawl.
12. Admin Summaries cho phép trigger summarize hàng loạt, xem phiên bản model, duyệt/chỉnh sửa summary thủ công, và bật/tắt auto-summary ở mức hệ thống.

1. Phase 6 - Chất lượng, bảo mật, vận hành (depends on all phases)
1. Backend tests: unit parser cho từng nguồn, service tests cho dedup, integration test cho API chính và summary API.
2. Frontend tests: component test cho list/detail/filter/summary và e2e smoke cho luồng chính.
3. AI quality checks: kiểm tra độ dài tóm tắt, ngôn ngữ tiếng Việt, tỉ lệ lỗi hallucination cơ bản theo bộ mẫu kiểm thử.
4. Thiết lập rate-limit cho admin trigger crawl/summarize, validation input, và bảo vệ endpoint admin bằng JWT access token + refresh token.
5. Thiết lập observability: metrics (Prometheus format hoặc actuator), log correlation theo crawl job và summary job.
6. Thiết lập CI/CD: build backend/frontend, chạy test/lint, build artifact hoặc Docker image, và deploy tự động lên EC2 qua GitHub Actions theo môi trường `staging`/`production`.

**Relevant files**
- Workspace hiện đang trống, các file cụ thể sẽ xuất hiện sau khi khởi tạo 2 project Angular và Spring Boot.
- Mẫu cấu trúc mục tiêu: `frontend/*`, `backend/src/main/java/*`, `backend/src/main/resources/*`, `docker-compose.yml`, `.github/workflows/*`, `infra/nginx/*`, `deploy/*`, `infra/redis/*`.
- File CI/CD dự kiến: workflow build/test, workflow deploy staging, workflow deploy production, script rollout/restart/healthcheck.

**Verification**
1. Chạy scheduler trong 2 chu kỳ và xác nhận bài mới được lưu đúng nguồn, đúng category, không trùng bản ghi.
2. Kiểm tra legal guard: các URL bị robots.txt chặn không bị crawl, và có log allow/disallow rõ theo từng job.
3. Kiểm tra Redis cache hoạt động cho robots/home/source health và hệ thống vẫn chạy đúng khi cache miss.
4. Kiểm tra API list/detail/search/filter và `/categories/:slug` trả đúng phân trang, đúng điều kiện lọc.
5. Xác nhận mặc định `auto-summary = OFF`, bài mới không tự enqueue summary job khi chưa bật cấu hình.
6. Bấm nút `AI Summarize` ở trang bài viết, kiểm tra summary job được tạo và summary hiển thị đúng sau khi xử lý xong.
7. Bật auto-summary từ admin settings, xác nhận bài mới hoặc bài cập nhật sẽ được enqueue tự động.
8. CRUD category từ admin: tạo chuyên mục cha/con, gán bài cho chuyên mục, xác nhận public route `/categories/:slug` hiển thị đúng bài.
9. Xác nhận `v_trending_articles` refresh đúng sau 30 phút; kết quả home trending thay đổi theo bài mới.
10. Bật `crawler.redis-dedup.enabled=true`, crawl lại source, xác nhận Redis key được tạo và bài trùng không insert lại DB.
11. Thử bật/tắt nguồn từ trang admin, xác nhận scheduler tôn trọng trạng thái nguồn.
12. Trigger crawl thủ công từ UI admin và đối chiếu dashboard cập nhật số liệu theo job mới.
13. Chạy workflow staging, xác nhận deploy thành công, healthcheck pass, UI và API truy cập được qua domain staging.
14. Kiểm tra rollback từ image/tag trước đó trên EC2 production hoặc staging mô phỏng.
15. Kiểm tra cost guard AI API key: vượt `SUMMARY_DAILY_BUDGET_USD` hoặc `SUMMARY_MAX_REQUESTS_PER_HOUR` thì job mới không gọi provider và được log rõ lý do.
16. Chạy test suite frontend/backend và kiểm tra tỷ lệ pass 100% trước khi phát hành.

**Decisions**
- Bao gồm: crawl 5 nguồn (VnExpress, Tuoi Tre, Thanh Nien, Dan Tri, kenh14.vn), tần suất 30-60 phút, PostgreSQL, Redis, tuân thủ robots.txt theo domain, lưu nội dung + metadata + link gốc.
- Bao gồm AI summarize qua API key (OpenAI/Azure OpenAI/OpenRouter): tóm tắt tiếng Việt theo bài viết, quản lý summary job, mặc định auto-summary tắt, hỗ trợ trigger/review summary từ trang admin và nút summarize trong trang bài viết; không chạy local LLM trên server Free Tier.
- Bao gồm category: bảng `category` cây 2 cấp, public route `/categories/:slug`, admin CRUD, filter bài theo chuyên mục.
- Bao gồm database views: `v_article_card`, `v_source_health`, `v_crawl_daily_stats`, `v_summary_metrics`, `v_trending_articles` (materialized). Schema đầy đủ với CHECK constraints, GIN index `tags`, composite index cho polling.
- Bao gồm Redis dedup dormant: code sẵn nhưng tắt; bật khi scale nhiều worker; fallback an toàn về DB upsert nếu Redis lỗi.
- Bao gồm UI: home, list, detail, category, search/filter, dashboard, admin nguồn crawl, admin categories, admin crawl data, admin summaries. Public side dùng Tailwind CSS news template custom.
- Bao gồm chiến lược deploy: GitHub Actions + EC2 cho staging/production, rollout có healthcheck và rollback cơ bản.
- Chưa bao gồm: recommendation/cá nhân hóa nâng cao, app mobile, đa ngôn ngữ.


**Option 1 - Chi tiết thực thi (đã chốt)**
- Cơ chế crawl: scheduler chạy mỗi 30-60 phút theo source, mỗi source có adapter list/detail riêng, trước khi fetch luôn kiểm tra robots cache.
- Cơ chế lọc trùng nhiều lớp:
1. Lớp 1 theo `canonical_url` (unique index cứng trong DB).
2. Lớp 2 theo `source_url` đã chuẩn hóa (loại tracking params như `utm_*`, `fbclid`, `gclid`).
3. Lớp 3 theo fingerprint nội dung: hash(`normalized_title + published_at_rounded + source_id`).
4. Lớp 4 gần trùng (near-duplicate) tùy chọn: simhash/minhash trên title+summary để loại các bài cập nhật rất nhỏ.
- Chính sách upsert: nếu trùng URL thì cập nhật metadata mới (tags, ảnh, category) nhưng giữ lịch sử crawl trong `crawl_result`.
- Chống trùng ở mức database:
1. Unique index trên `canonical_url` khi khác null.
2. Unique index trên `normalized_source_url`.
3. Index trên `content_fingerprint` để detect nhanh trùng logic.
4. Bảng `article_duplicate_map` để lưu quan hệ `original_article_id -> duplicate_article_id`, lý do merge và thời điểm merge.
5. Khi có race condition nhiều worker cùng insert, backend dùng upsert (`ON CONFLICT DO UPDATE`) để DB là lớp chặn cuối cùng.

- Chính sách AI summarize tạm thời cho MVP: ưu tiên provider dùng API key (khuyến nghị OpenAI `gpt-4.1-mini`, gemini-2.5-flash hoặc Azure OpenAI model tương đương; có thể thay bằng OpenRouter để tối ưu giá)
- Chiến lược summarize:
1. Mặc định `auto-summary = OFF`; chỉ khi admin bật cấu hình thì bài mới hoặc bài cập nhật mới được enqueue tự động.
2. Luôn cho phép trigger thủ công bằng nút `AI Summarize` trong trang chi tiết bài viết.
3. Sinh 2 phiên bản `short_summary` (1-2 câu) và `standard_summary` (4-6 câu).
4. Áp rule kiểm duyệt đầu ra: tiếng Việt, không thêm fact ngoài bài, không quá ngưỡng ký tự.
5. Nếu model miễn phí timeout hoặc chất lượng thấp, hệ thống giữ trạng thái `PENDING_REVIEW` hoặc `FAILED` thay vì chèn summary kém chất lượng.
- Trang Home hiển thị:
1. Hero block: top 5 tin mới nhất toàn hệ thống (ưu tiên bài có summary).
2. Feed chính phân trang: tiêu đề, nguồn, thời gian, ảnh đại diện, short summary, nhãn chuyên mục.
3. Cụm theo nguồn: mỗi nguồn 3-5 bài mới nhất để người dùng quét nhanh.
4. Khối Trending 24h: bài có nhiều lượt xem/click nội bộ hoặc được recrawl nhiều.
5. Khối Health status mini: trạng thái crawl gần nhất (ok/fail) của từng nguồn để minh bạch dữ liệu.
- API Home đề xuất:
1. `GET /api/public/home` trả payload tổng hợp (hero, feed, per-source, trending).
2. `GET /api/public/articles` cho list/search/filter chi tiết (dùng lại ở trang list).

**Database Schema & Tối ưu**

1. Bảng `news_source`: `id BIGSERIAL PK`, `name VARCHAR(100) NOT NULL`, `slug VARCHAR(100) UNIQUE NOT NULL`, `base_url VARCHAR(500) NOT NULL`, `home_url VARCHAR(500)`, `logo_url VARCHAR(500)`, `description TEXT`, `is_active BOOL DEFAULT TRUE`, `crawl_interval_minutes INT DEFAULT 60`, `user_agent VARCHAR(300)`, `last_crawled_at TIMESTAMPTZ`, `last_success_at TIMESTAMPTZ`, `consecutive_fail_count INT DEFAULT 0`, `robots_cache_ttl_seconds INT DEFAULT 3600`, `created_at/updated_at TIMESTAMPTZ DEFAULT NOW()`.

2. Bảng `category`: `id BIGSERIAL PK`, `name VARCHAR(100) NOT NULL`, `slug VARCHAR(100) UNIQUE NOT NULL`, `parent_id BIGINT FK -> category(id) NULL` (cây 2 cấp: nhóm lớn → chuyên mục), `display_order INT DEFAULT 0`, `is_active BOOL DEFAULT TRUE`, `created_at TIMESTAMPTZ DEFAULT NOW()`. Constraint: `CHECK (parent_id <> id)`.

3. Bảng `news_article` (core):
   - PK/FK: `id BIGSERIAL PK`, `source_id BIGINT FK NOT NULL -> news_source`, `category_id BIGINT FK -> category`.
   - Nội dung: `title VARCHAR(1000) NOT NULL`, `slug VARCHAR(1100) UNIQUE`, `excerpt TEXT`, `content_html TEXT`, `content_text TEXT` (plain text dùng cho fingerprint/search), `author VARCHAR(300)`, `image_url VARCHAR(500)`, `image_alt VARCHAR(300)`, `tags TEXT[]`.
   - URL / dedup: `source_url VARCHAR(2000) NOT NULL`, `normalized_source_url VARCHAR(2000)` (bỏ UTM/tracking params), `canonical_url VARCHAR(2000)`, `content_fingerprint VARCHAR(64)` (SHA-256 normalized_title+published_at_rounded+source_id), `simhash_value BIGINT` (near-dup, optional).
   - Thời gian: `published_at TIMESTAMPTZ`, `first_crawled_at TIMESTAMPTZ DEFAULT NOW()`, `last_crawled_at TIMESTAMPTZ`, `crawl_count INT DEFAULT 1`.
   - Trạng thái: `view_count INT DEFAULT 0`, `status VARCHAR(20) DEFAULT 'ACTIVE'` CHECK IN (ACTIVE, HIDDEN, DUPLICATE, ARCHIVED), `is_summarized BOOL DEFAULT FALSE`, `created_at/updated_at TIMESTAMPTZ DEFAULT NOW()`.

4. Bảng `crawl_job`: `id BIGSERIAL PK`, `source_id BIGINT FK NOT NULL`, `job_type VARCHAR(20)` CHECK IN (SCHEDULED, MANUAL, RETRY), `status VARCHAR(20)` CHECK IN (PENDING, RUNNING, SUCCESS, FAILED, PARTIAL), `trigger_type VARCHAR(10)`, `triggered_by VARCHAR(200)`, `parser_version VARCHAR(50)`, `articles_found/new/updated/skipped/failed INT DEFAULT 0`, `robots_checked BOOL`, `robots_allowed BOOL`, `error_message TEXT`, `started_at/finished_at TIMESTAMPTZ`, `duration_ms BIGINT`, `created_at TIMESTAMPTZ DEFAULT NOW()`.

5. Bảng `crawl_result` (log per-article): `id BIGSERIAL PK`, `crawl_job_id BIGINT FK NOT NULL`, `article_id BIGINT FK`, `source_url VARCHAR(2000) NOT NULL`, `result VARCHAR(20)` CHECK IN (NEW, UPDATED, DUPLICATE, SKIPPED, FAILED, ROBOTS_BLOCKED), `http_status INT`, `response_time_ms INT`, `error_message TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW()`.

6. Bảng `news_summary`: `id BIGSERIAL PK`, `article_id BIGINT FK UNIQUE NOT NULL` (1 bản ghi per article), `short_summary TEXT`, `standard_summary TEXT`, `model_name VARCHAR(100)`, `model_version VARCHAR(50)`, `prompt_version VARCHAR(20)`, `trigger_mode VARCHAR(10)` CHECK IN (AUTO, MANUAL), `review_status VARCHAR(20) DEFAULT 'PENDING_REVIEW'` CHECK IN (PENDING_REVIEW, APPROVED, REJECTED, EDITED), `reviewed_by VARCHAR(200)`, `reviewed_at TIMESTAMPTZ`, `generated_at TIMESTAMPTZ`, `token_count INT`, `generation_latency_ms INT`, `retry_count INT DEFAULT 0`, `error_message TEXT`, `created_at/updated_at TIMESTAMPTZ DEFAULT NOW()`.

7. Bảng `summary_job` (queue): `id BIGSERIAL PK`, `article_id BIGINT FK NOT NULL`, `priority INT DEFAULT 5` (1=cao, 10=thấp), `status VARCHAR(20) DEFAULT 'QUEUED'` CHECK IN (QUEUED, PROCESSING, DONE, FAILED, CANCELLED), `trigger_mode VARCHAR(10)`, `triggered_by VARCHAR(200)`, `max_retries INT DEFAULT 3`, `retry_count INT DEFAULT 0`, `next_retry_at TIMESTAMPTZ`, `locked_at TIMESTAMPTZ`, `locked_by VARCHAR(200)` (worker lock idempotency), `error_message TEXT`, `created_at/updated_at TIMESTAMPTZ DEFAULT NOW()`. Constraint: `CHECK (retry_count <= max_retries)`.

8. Bảng `article_duplicate_map`: `id BIGSERIAL PK`, `original_article_id BIGINT FK NOT NULL`, `duplicate_article_id BIGINT FK UNIQUE NOT NULL`, `merge_reason VARCHAR(50)` CHECK IN (SAME_URL, SAME_FINGERPRINT, NEAR_DUP), `confidence FLOAT`, `detected_at TIMESTAMPTZ DEFAULT NOW()`.

9. Bảng `app_config` (feature flags + runtime settings): `key VARCHAR(100) PK`, `value TEXT NOT NULL`, `value_type VARCHAR(20)` CHECK IN (STRING, BOOLEAN, INT, JSON), `description TEXT`, `updated_by VARCHAR(200)`, `updated_at TIMESTAMPTZ DEFAULT NOW()`. Seed mặc định: `auto_summary_enabled=false`, `summary_daily_limit=500`, `crawl_default_interval_minutes=60`.

10. Indexes chiến lược:
    - `news_article`: UNIQUE idx `canonical_url WHERE canonical_url IS NOT NULL`, UNIQUE idx `normalized_source_url`, idx `content_fingerprint`, idx `(source_id, published_at DESC)`, idx `(category_id, published_at DESC)`, idx `(status, published_at DESC)`, idx `(is_summarized, published_at DESC)`, GIN idx `tags` (để filter/search theo tag).
    - `crawl_job`: idx `(source_id, created_at DESC)`, idx `(status, created_at DESC)`.
    - `summary_job`: COMPOSITE idx `(status, priority, created_at)` cho worker polling, idx `article_id`.
    - `crawl_result`: idx `crawl_job_id`, idx `article_id`.
    - Tất cả FK đều có index tương ứng.

**Database Views**

1. `v_article_card`: LEFT JOIN `news_article` + `news_source` + `category` + `news_summary`; expose id, title, slug, excerpt, image_url, author, published_at, source_name, source_slug, source_logo_url, category_name, category_slug, short_summary, is_summarized, status. Dùng cho home/list/category pages.

2. `v_source_health`: Subquery grouped `crawl_job` per source (last 7 ngày); expose source_id, source_name, last_crawl_at, last_status, success_count_7d, fail_count_7d, avg_duration_ms, articles_new_7d. Dùng cho dashboard + home health mini block.

3. `v_crawl_daily_stats`: GROUP crawl_job theo `DATE(started_at)` + `source_id`; expose date, source_name, total_jobs, articles_found, articles_new, articles_failed, avg_duration_ms. Dùng cho dashboard chart.

4. `v_summary_metrics`: GROUP `summary_job` + `news_summary` theo status, trigger_mode, model_name; expose count theo nhóm. Dùng cho dashboard summarize section.

5. `v_trending_articles` (MATERIALIZED VIEW): Score = `(view_count * 0.6 + crawl_count * 0.4)` với bài `published_at >= NOW() - interval '48 hours'` và `status='ACTIVE'`; LEFT JOIN `news_summary`; ORDER BY score DESC LIMIT 20. Refresh bằng `REFRESH MATERIALIZED VIEW CONCURRENTLY v_trending_articles` mỗi 30 phút qua job phụ.

6. Tối ưu truy vấn:
   - Home page dùng `v_article_card` + `v_trending_articles`; cache Redis key `cache:home:v1` TTL 5 phút.
   - List/search dùng `v_article_card` filter index scan; cache Redis key hash của query params TTL 2 phút.
   - Nếu `news_article` > 5 triệu bản ghi: xem xét RANGE partition theo `published_at` theo năm.
   - `EXPLAIN ANALYZE` và `pg_stat_statements` để theo dõi slow query; đặt `work_mem=16MB` cho sort/hash join.

**Redis Dedup Strategy (Dormant - không kích hoạt mặc định)**

- Mục đích: giảm DB write pressure và tránh race condition khi nhiều crawler worker chạy đồng thời cho cùng source.
- Trạng thái: code được viết sẵn nhưng bị tắt hoàn toàn qua flag `crawler.redis-dedup.enabled=false` (default false). Chỉ bật khi scale ra nhiều worker instance hoặc khi DB write latency trở thành bottleneck.
- Cấu trúc key:
  1. `dedup:url:{sha256(normalized_source_url)}` → TTL 24h; giá trị `1` hoặc `article_id`.
  2. `dedup:fp:{content_fingerprint}` → TTL 12h; detect trùng nội dung cross-source.
  3. `dedup:lock:crawl:{source_id}` → TTL `(crawl_interval + 60s)`; distributed lock bổ sung cho ShedLock.
- Pipeline khi enabled: trước fetch detail, kiểm tra Redis key → nếu hit thì skip (không query DB) → nếu miss thì fetch + persist + SET key Redis.
- Fallback an toàn: nếu Redis connection lỗi, `RedisDeduplicator` tự catch exception và fall back về `DbDeduplicator` (ON CONFLICT DO UPDATE); tính đúng đắn không bị ảnh hưởng.
- Lớp code: `crawler/dedup/RedisDeduplicator.java` (disabled bean `@ConditionalOnProperty`), `crawler/dedup/DbDeduplicator.java` (primary), `crawler/dedup/DeduplicatorChain.java` (composite, inject theo flag).

**Technical Architecture**
- Crawler engine: Spring Boot module riêng theo flow `scheduler -> source adapter -> parser -> persistence`, dùng strategy pattern cho từng nguồn.
- Fetching strategy: mặc định dùng Jsoup/HTTP client cho tốc độ và độ ổn định; chỉ dùng Playwright ở adapter cần render JavaScript.
- Redis layer: dùng cho cache robots.txt, cache home/list query nóng, cache source health ngắn hạn, rate-limit admin actions, và optional distributed flags/config cache.
- Job orchestration: `crawl_job` và `summary_job` là nguồn sự thật cho trạng thái xử lý; worker poll DB theo batch nhỏ, retry giới hạn, idempotent theo article/job key.
- AI summarize: tạo abstraction `SummaryProvider` để đổi giữa OpenAI/Azure OpenAI/local model mà không ảnh hưởng business logic.
- Summarization flow: mặc định không enqueue tự động; khi admin bật `auto-summary` hoặc người dùng bấm nút `AI Summarize` trong bài viết thì mới tạo `summary_job`, worker dựng prompt tiếng Việt -> gọi provider -> validate output -> lưu `news_summary`.
- Summary policy: lưu 2 mức tóm tắt (`short_summary`, `standard_summary`), `model_name`, `model_version`, `prompt_version`, `generated_at`, `review_status`, `trigger_mode` (`AUTO` hoặc `MANUAL`).
- Admin security: Angular dùng JWT access token ngắn hạn + refresh token; backend phân quyền tối thiểu cho `ADMIN` và `EDITOR_SUMMARY` nếu cần duyệt nội dung.
- Frontend integration: public pages chỉ đọc dữ liệu đã summarize; trang detail có nút `AI Summarize`; admin pages hiển thị trạng thái job, lỗi model, thao tác retry/review và công tắc auto-summary.
- Observability: tách metric cho crawl success rate, summarize latency, token usage, error rate theo provider/model.

**Project Structure**
- Root: `frontend/`, `backend/`, `.github/workflows/`, `deploy/`, `infra/nginx/`, `docker-compose.yml`, `.env.example`, `README.md`.
- `frontend/`: Angular application cho public site và admin portal.
- `frontend/src/app/core/`: auth, interceptors, guards, layout shell, config, shared singleton services.
- `frontend/src/app/shared/`: UI components dùng chung, pipes, directives, reusable dialogs, table/filter widgets.
- `frontend/src/app/features/home/`: trang home và các widget feed/tóm tắt nổi bật.
- `frontend/src/app/features/news/`: danh sách bài viết, chi tiết bài viết, tìm kiếm và lọc.
- `frontend/src/app/features/categories/`: trang danh sách chuyên mục và trang bài viết theo chuyên mục (`/categories/:slug`).
- `frontend/src/app/features/dashboard/`: dashboard thống kê crawl và summarize.
- `frontend/src/app/features/admin-sources/`: CRUD nguồn crawl, bật/tắt nguồn, trigger crawl.
- `frontend/src/app/features/admin-categories/`: CRUD chuyên mục, cây 2 cấp, sắp xếp thứ tự, bật/tắt.
- `frontend/src/app/features/admin-crawl-data/`: lịch sử crawl job, lỗi, re-crawl, retention actions.
- `frontend/src/app/features/admin-summaries/`: summary jobs, review/edit summary, retry summarize.
- `frontend/src/app/models/`: interface/type cho API contracts.
- `frontend/src/styles/`: Tailwind CSS config, `_news-card.scss`, `_hero.scss`, `_feed-strip.scss`, `_badge.scss` cho public template.
- `frontend/src/environments/`: `environment.ts`, `environment.staging.ts`, `environment.prod.ts`.
- `backend/src/main/java/.../config/`: cấu hình Spring, security, OpenAPI, scheduler, HTTP client, AI provider.
- `backend/src/main/java/.../domain/`: entity, enum, value object cho article, source, crawl job, summary job.
- `backend/src/main/java/.../repository/`: JPA repositories hoặc query layer.
- `backend/src/main/java/.../service/`: business services cho crawl, article query, summary orchestration, admin actions.
- `backend/src/main/java/.../crawler/`: source adapters, parsers, robots service, fetch client, dedup pipeline.
- `backend/src/main/java/.../crawler/dedup/`: `DbDeduplicator.java` (primary), `RedisDeduplicator.java` (dormant, `@ConditionalOnProperty`), `DeduplicatorChain.java` (composite).
- `backend/src/main/java/.../summary/`: prompt builder, provider abstraction, summary worker, review workflow.
- `backend/src/main/java/.../web/`: REST controllers public/admin, request/response DTO, exception handlers.
- `backend/src/main/java/.../security/`: JWT auth, refresh token, role handling, filters.
- `backend/src/main/resources/db/migration/`: SQL migrations Flyway hoặc changelog Liquibase.
- `backend/src/main/resources/`: `application.yml`, `application-dev.yml`, `application-staging.yml`, `application-prod.yml`.
- `backend/src/test/`: unit test parser/service, integration test API, repository test.

**Technology Stack**
- Frontend: Angular 19+, TypeScript, Angular Router, Angular HttpClient, RxJS, PrimeNG cho admin UI, ApexCharts hoặc ECharts cho dashboard.
- Frontend public template: Tailwind CSS 3 (utility-first) + custom news components (NewsCard, HeroBanner, FeedStrip, SourceBadge, CategoryChip, TrendingBlock); không dùng UI framework nặng ở public side để giữ LCP < 2.5s. Admin portal vẫn dùng PrimeNG cho table/form phức tạp.
- Frontend styling: SCSS cho component-level, Tailwind config cho design tokens (màu nguồn tin, typography), DomSanitizer cho news HTML content.
- Backend: Java 21, Spring Boot 3.4+, Spring Web, Spring Data JPA, Spring Security, Validation, Actuator.
- Scheduling và locking: Spring Scheduler + ShedLock.
- Crawl parsing: Jsoup là mặc định; Playwright Java chỉ dùng ở adapter cần render JavaScript.
- Database: PostgreSQL 16, Flyway hoặc Liquibase cho migration.
- Cache và infra phụ trợ: Redis 7 dùng cho cache, rate-limit, source health cache và feature/config cache ngắn hạn.
- Auth: JWT access token + refresh token; password hash bằng BCrypt/Argon2.
- API docs: springdoc OpenAPI/Swagger.
- AI integration: abstraction `SummaryProvider`; mặc định dùng provider API key (OpenAI/Azure OpenAI/OpenRouter), lưu `provider_name`, `model_name`, `prompt_version`, `token_count` để theo dõi chi phí; local model chỉ là phương án mở rộng khi nâng cấp hạ tầng.
- Testing backend: JUnit 5, Spring Boot Test, Testcontainers cho PostgreSQL nếu cần integration test thực tế.
- Testing frontend: Jasmine/Karma hoặc Jest tùy scaffold Angular, Playwright cho e2e smoke test.
- Build và packaging: Docker, Docker Compose, GitHub Actions, GHCR hoặc Docker Hub để lưu image.
- Reverse proxy và TLS: Nginx + Let's Encrypt.



**Sprint Backlog**
1. Sprint 1 - Foundation và Crawl Core
1. Khởi tạo Angular, Spring Boot, PostgreSQL + Redis, Docker Compose, Flyway/Liquibase, cấu hình môi trường `dev`.
2. Hoàn thành schema đầy đủ: `news_source`, `category`, `news_article`, `crawl_job`, `crawl_result`, `news_summary`, `summary_job`, `app_config` với tất cả indexes và CHECK constraints theo plan.
3. Tạo database views: `v_article_card`, `v_source_health`, `v_crawl_daily_stats`, `v_summary_metrics`, `v_trending_articles` (materialized).
4. Cài đặt crawler framework, `DbDeduplicator` (primary), stub `RedisDeduplicator` (dormant), adapter mẫu cho 1-2 nguồn, robots cache, scheduler với ShedLock.
5. Hoàn thành public API tối thiểu cho home/list/detail/categories.
6. Kết quả mong đợi: crawl được nguồn đầu tiên end-to-end, category phân loại được bài, hiển thị trên UI cơ bản.
2. Sprint 2 - Mở rộng nguồn và Admin/Crawl Data
1. Mở rộng đủ 5 nguồn crawl, thêm re-crawl, retention policy, log lỗi theo nguồn.
2. Hoàn thiện admin sources, admin categories (CRUD cây 2 cấp), admin crawl data, dashboard crawl metrics.
3. Thêm auth JWT cho admin, rate-limit và validation.
4. Kết quả mong đợi: đội vận hành có thể quản trị nguồn, chuyên mục, theo dõi job, và trigger crawl thủ công.
3. Sprint 3 - AI Summarize và Review Flow
1. Tích hợp `SummaryProvider`, summary worker, queue `summary_job`, prompt versioning, review status.
2. Hoàn thiện summary API, admin summaries, hiển thị summary trên home/detail/dashboard.
3. Thêm quality checks cho summary, ngân sách token/ngày, retry policy theo provider.
4. Kết quả mong đợi: bài viết mới được summarize tự động, admin có thể retry/review khi lỗi.
4. Sprint 4 - Hardening và Production Readiness
1. Hoàn thiện test suite, observability, alerting, healthcheck, backup/restore DB.
2. Thiết lập GitHub Actions, deploy staging/production lên EC2, Nginx reverse proxy, HTTPS, rollback.
3. Chạy load/smoke test, kiểm tra `v_trending_articles` refresh, và quy trình release.
4. Kết quả mong đợi: hệ thống sẵn sàng vận hành production với quy trình release lặp lại được.

**Deployment Strategy**
- Phương án khuyến nghị cho AWS Free Tier (ưu tiên chi phí thấp): dùng 1 EC2 `t3.micro` duy nhất cho `staging+production` theo mô hình blue/green nhẹ bằng 2 compose profiles (`app-blue`, `app-green`) trên cùng host; DB dùng PostgreSQL container local với EBS gp3 30GB.
- Nếu cần tách môi trường rõ hơn (khuyến nghị khi có traffic thật): 2 EC2 `t3.micro` (staging/prod), nhưng chỉ nên áp dụng sau khi hết Free Tier hoặc có ngân sách ổn định.
- Thành phần trên EC2: Nginx reverse proxy, Angular static build, Spring Boot API + crawler + summary worker, PostgreSQL, Redis. Trên Free Tier: tắt Playwright mặc định, chỉ dùng Jsoup-first.
- Kiểu deploy khuyến nghị: Docker Compose + GHCR image; mỗi deploy pull image mới, chạy migration, recreate backend/worker, giữ nguyên Nginx.
- Chiến lược release cho Free Tier: `main` -> deploy `staging` profile (port nội bộ khác), verify smoke test; `tag v*` hoặc manual -> switch symlink/upstream Nginx sang profile production.
- Zero/low downtime mức MVP: healthcheck `/actuator/health`, warmup backend mới trước khi switch Nginx upstream.
- Rollback: giữ 2 image tag gần nhất trên host; workflow cho phép chọn tag cũ và `docker compose up -d` lại profile trước đó.

**GitHub Actions CI/CD**
1. Workflow `ci.yml`
1. Trigger: pull request và push vào `main`.
2. Job: setup JDK + Node, cache dependency, chạy backend test, frontend test, lint, build artifact.
3. Optional: build Docker image và push lên GitHub Container Registry.
2. Workflow `deploy-staging.yml`
1. Trigger: push `main` sau khi CI pass.
2. Job: build/pull image, SSH vào EC2 staging hoặc dùng self-hosted runner, pull code/config, chạy migration, `docker compose up -d`, healthcheck, smoke test API/UI.
3. Workflow `deploy-production.yml`
1. Trigger: tag release hoặc manual approval.
2. Job: giống staging nhưng có environment protection rules, backup cấu hình hiện tại, rollout production, verify healthcheck, thông báo trạng thái release.
4. Secrets bắt buộc trên GitHub Actions
1. `EC2_HOST`, `EC2_SSH_USER`, `EC2_SSH_KEY`, `EC2_SSH_PORT` (nếu custom).
2. `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `SPRING_REDIS_HOST`, `SPRING_REDIS_PORT`.
3. `JWT_SECRET`, `AI_PROVIDER` (`OPENAI`/`AZURE_OPENAI`/`OPENROUTER`), `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL` (optional), `GITHUB_TOKEN`/`GHCR_TOKEN`.
4. Biến frontend như `ANGULAR_API_BASE_URL`, `ANGULAR_ENV`.
5. Cost guard secrets/vars: `SUMMARY_DAILY_BUDGET_USD`, `SUMMARY_MAX_REQUESTS_PER_HOUR`, `SUMMARY_MAX_TOKENS_PER_JOB`.

**Technical Requirements**
- AWS Free Tier mục tiêu: 1 EC2 `t3.micro` (2 vCPU burst, 1GB RAM), EBS gp3 30GB, Ubuntu 22.04 LTS. Dùng swap 2GB để giảm rủi ro OOM (không thay thế RAM thật).
- Chế độ runtime Free Tier: backend JVM giới hạn `-Xms256m -Xmx512m`; tắt Playwright mặc định; crawler concurrency thấp (2-4 worker), crawl interval 45-60 phút.
- AI summarize trên Free Tier: bắt buộc dùng provider API key.
- Redis/PostgreSQL: chạy cùng host bằng Docker Compose; bật backup DB hằng ngày (`pg_dump` + rotate 7-14 ngày) lên S3 (nếu có) hoặc volume backup thứ hai.
- Domain và TLS: Route53 (hoặc DNS bất kỳ), HTTPS qua Let's Encrypt + Nginx.
- Observability tối thiểu: application logs, Nginx logs, disk/RAM/CPU metrics, cảnh báo khi memory > 85%, crawl error rate tăng cao, hoặc summarize failure rate vượt ngưỡng.
- Bảo mật tối thiểu: chỉ mở 80/443; port 22 giới hạn IP; DB/Redis không public Internet; secrets ở GitHub Secrets + `.env` trên server.
- NFR mục tiêu cho Free Tier: thời gian crawl một chu kỳ dưới 20 phút với 5 nguồn, tỉ lệ crawl thành công > 93%, summary latency trung bình < 90 giây/batch nhỏ, phục hồi deploy < 15 phút.

**Further Considerations**
1. Khuyến nghị cho AWS Free Tier: dùng API key provider (OpenAI/Azure OpenAI/OpenRouter).
2. Bật cost guard bắt buộc: daily budget cap, max requests/giờ, max tokens/job; khi vượt ngưỡng thì tự động chuyển trạng thái summary job sang `PENDING_REVIEW` hoặc `SKIPPED_BUDGET`.
3. Cân nhắc nâng cấp kiến trúc khi traffic tăng: tách PostgreSQL sang RDS, tách worker summarize khỏi API host, bật Redis dedup và tăng kích thước instance.
4. Cân nhắc chính sách lưu ảnh: lưu URL gốc ở MVP, chỉ tải về object storage nếu có yêu cầu chống link chết hoặc cần CDN nội bộ.