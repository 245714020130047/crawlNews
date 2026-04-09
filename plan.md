## Plan: Nền tảng Crawl Tin Tức Việt Nam

Xây dựng hệ thống 2 lớp Angular + Spring Boot cho bài toán crawl tin tức từ VnExpress, Tuoi Tre, Thanh Nien, Dan Tri, kenh14.vn với chu kỳ 30-60 phút, tuân thủ robots.txt theo từng nguồn, quản lý vòng đời crawl data, dùng Redis cho cache và tối ưu vận hành, lưu nội dung bài viết + metadata + link gốc vào PostgreSQL, và bổ sung AI summarize news theo cơ chế manual-first, có thể bật/tắt tự động bằng cấu hình, để hỗ trợ hiển thị/tóm tắt nhanh trên home, detail, dashboard và trang quản trị.

**Steps**
1. Phase 1 - Khởi tạo kiến trúc nền (blocking)
1. Tạo 2 project độc lập: `frontend` (Angular) và `backend` (Spring Boot).
2. Chuẩn hóa môi trường local bằng Docker Compose cho PostgreSQL + Redis + pgAdmin (tuỳ chọn) và profile `dev` cho backend.
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
7. Chuẩn hóa dữ liệu lưu nội dung + metadata + link gốc: title, summary, content_html/content_text, author, category, tags, image, published_at, crawl_at, source_url, canonical_url.
8. Thiết kế pipeline: kiểm tra robots -> fetch list -> lọc trùng -> fetch detail -> parse -> persist -> ghi log kết quả.

1. Phase 4 - Public API + Admin API + AI Summarize (depends on Phase 2/3)
1. Public API đầy đủ: `GET /api/public/home`, `GET /api/public/articles`, `GET /api/public/articles/{id-or-slug}`, `GET /api/public/sources`, `GET /api/public/categories`, `GET /api/public/trending`, `GET /api/public/search/suggestions`.
2. Dashboard API đầy đủ: `GET /api/admin/dashboard/overview`, `GET /api/admin/dashboard/crawl-metrics`, `GET /api/admin/dashboard/summary-metrics`, `GET /api/admin/dashboard/source-health`.
3. Summary API: `GET /api/public/articles/{id}/summary`, `POST /api/public/articles/{id}/summarize`, `POST /api/admin/summaries/jobs`, `GET /api/admin/summaries/jobs`, `POST /api/admin/summaries/{articleId}/retry`, `PUT /api/admin/summaries/{articleId}`, `GET /api/admin/settings/summary`, `PUT /api/admin/settings/summary`.
4. AI summarize chạy bất đồng bộ theo `summary_job` queue trong PostgreSQL: mặc định `auto-summary = OFF`, chỉ enqueue tự động khi admin bật cấu hình; ngoài ra người dùng/admin có thể bấm nút summarize ngay trong trang bài viết để tạo job thủ công.
5. Admin Sources API: `GET/POST/PUT /api/admin/sources`, `POST /api/admin/sources/{id}/enable`, `POST /api/admin/sources/{id}/disable`, `POST /api/admin/sources/{id}/crawl`.
6. Admin Crawl Data API: `GET /api/admin/crawl-jobs`, `GET /api/admin/crawl-jobs/{id}`, `POST /api/admin/crawl-jobs/retry`, `POST /api/admin/crawl-jobs/run-all`, `POST /api/admin/articles/reindex`, `DELETE /api/admin/crawl-raw-snapshots` theo retention policy.
7. Admin Articles API: `GET /api/admin/articles`, `GET /api/admin/articles/{id}`, `POST /api/admin/articles/{id}/re-crawl`, `POST /api/admin/articles/{id}/deduplicate`, `PATCH /api/admin/articles/{id}/status`.
8. Bổ sung OpenAPI/Swagger, chuẩn error response, pagination/filter/sort nhất quán cho mọi endpoint list.

1. Phase 5 - Angular app (parallel with late Phase 4 once API contract ổn định)
1. Cấu trúc app theo feature modules: Home, NewsList, NewsDetail, SearchFilter, Dashboard, AdminSources, AdminCrawlData, AdminSummaries.
2. Tạo service gọi API, state quản lý bằng RxJS (hoặc NgRx nếu dữ liệu dashboard/summarize phức tạp).
3. Trang Home hiển thị tin mới + nhóm theo nguồn/chuyên mục + AI summary ngắn nếu đã có summary.
4. Trang List + Search/Filter hỗ trợ phân trang server-side, debounce tìm kiếm.
5. Trang Detail render nội dung bài viết (sanitize HTML), hiển thị metadata nguồn/thời gian + summary và trạng thái summarize; có nút `AI Summarize` để tạo summary thủ công cho bài hiện tại.
6. Dashboard hiển thị biểu đồ crawl, tình trạng nguồn, tỉ lệ bài đã summarize, và trạng thái auto-summary đang bật/tắt.
7. Admin Sources cho phép thêm/sửa/bật tắt nguồn và trigger crawl thủ công.
8. Admin Crawl Data cho phép xem job, lọc theo trạng thái lỗi, trigger re-crawl.
9. Admin Summaries cho phép trigger summarize hàng loạt, xem phiên bản model, duyệt/chỉnh sửa summary thủ công, và bật/tắt auto-summary ở mức hệ thống.

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
1. Chạy scheduler trong 2 chu kỳ và xác nhận bài mới được lưu đúng nguồn, không trùng bản ghi.
2. Kiểm tra legal guard: các URL bị robots.txt chặn không bị crawl, và có log allow/disallow rõ theo từng job.
3. Kiểm tra Redis cache hoạt động cho robots/home/source health và hệ thống vẫn chạy đúng khi cache miss.
4. Kiểm tra API list/detail/search/filter trả đúng phân trang, đúng điều kiện lọc.
5. Xác nhận mặc định `auto-summary = OFF`, bài mới không tự enqueue summary job khi chưa bật cấu hình.
6. Bấm nút `AI Summarize` ở trang bài viết, kiểm tra summary job được tạo và summary hiển thị đúng sau khi xử lý xong.
7. Bật auto-summary từ admin settings, xác nhận bài mới hoặc bài cập nhật sẽ được enqueue tự động.
8. Thử bật/tắt nguồn từ trang admin, xác nhận scheduler tôn trọng trạng thái nguồn.
9. Trigger crawl thủ công từ UI admin và đối chiếu dashboard cập nhật số liệu theo job mới.
10. Chạy workflow staging, xác nhận deploy thành công, healthcheck pass, UI và API truy cập được qua domain staging.
11. Kiểm tra rollback từ image/tag trước đó trên EC2 production hoặc staging mô phỏng.
12. Chạy test suite frontend/backend và kiểm tra tỷ lệ pass 100% trước khi phát hành.

**Decisions**
- Bao gồm: crawl 5 nguồn (VnExpress, Tuoi Tre, Thanh Nien, Dan Tri, kenh14.vn), tần suất 30-60 phút, PostgreSQL, Redis, tuân thủ robots.txt theo domain, lưu nội dung + metadata + link gốc.
- Bao gồm AI summarize: tóm tắt tiếng Việt theo bài viết, quản lý summary job, mặc định auto-summary tắt, hỗ trợ trigger/review summary từ trang admin và nút summarize trong trang bài viết.
- Bao gồm UI: home, list, detail, search/filter, dashboard, admin nguồn crawl, admin crawl data, admin summaries.
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

- Chính sách AI summarize tạm thời cho MVP: ưu tiên model miễn phí/local trước, cụ thể `Ollama + qwen2.5:7b-instruct` hoặc `gemma2:9b` nếu server đủ tài nguyên; fallback sang Hugging Face Inference free tier nếu cần.
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
- `frontend/src/app/features/dashboard/`: dashboard thống kê crawl và summarize.
- `frontend/src/app/features/admin-sources/`: CRUD nguồn crawl, bật/tắt nguồn, trigger crawl.
- `frontend/src/app/features/admin-crawl-data/`: lịch sử crawl job, lỗi, re-crawl, retention actions.
- `frontend/src/app/features/admin-summaries/`: summary jobs, review/edit summary, retry summarize.
- `frontend/src/app/models/`: interface/type cho API contracts.
- `frontend/src/environments/`: `environment.ts`, `environment.staging.ts`, `environment.prod.ts`.
- `backend/src/main/java/.../config/`: cấu hình Spring, security, OpenAPI, scheduler, HTTP client, AI provider.
- `backend/src/main/java/.../domain/`: entity, enum, value object cho article, source, crawl job, summary job.
- `backend/src/main/java/.../repository/`: JPA repositories hoặc query layer.
- `backend/src/main/java/.../service/`: business services cho crawl, article query, summary orchestration, admin actions.
- `backend/src/main/java/.../crawler/`: source adapters, parsers, robots service, fetch client, dedup pipeline.
- `backend/src/main/java/.../summary/`: prompt builder, provider abstraction, summary worker, review workflow.
- `backend/src/main/java/.../web/`: REST controllers public/admin, request/response DTO, exception handlers.
- `backend/src/main/java/.../security/`: JWT auth, refresh token, role handling, filters.
- `backend/src/main/resources/db/migration/`: SQL migrations Flyway hoặc changelog Liquibase.
- `backend/src/main/resources/`: `application.yml`, `application-dev.yml`, `application-staging.yml`, `application-prod.yml`.
- `backend/src/test/`: unit test parser/service, integration test API, repository test.

**Technology Stack**
- Frontend: Angular 19+, TypeScript, Angular Router, Angular HttpClient, RxJS, Angular Material hoặc PrimeNG cho admin UI, ApexCharts hoặc ECharts cho dashboard.
- Frontend styling: SCSS, CSS variables, responsive layout, sanitize HTML cho news detail.
- Backend: Java 21, Spring Boot 3.4+, Spring Web, Spring Data JPA, Spring Security, Validation, Actuator.
- Scheduling và locking: Spring Scheduler + ShedLock.
- Crawl parsing: Jsoup là mặc định; Playwright Java chỉ dùng ở adapter cần render JavaScript.
- Database: PostgreSQL 16, Flyway hoặc Liquibase cho migration.
- Cache và infra phụ trợ: Redis 7 dùng cho cache, rate-limit, source health cache và feature/config cache ngắn hạn.
- Auth: JWT access token + refresh token; password hash bằng BCrypt/Argon2.
- API docs: springdoc OpenAPI/Swagger.
- AI integration: abstraction `SummaryProvider`; ưu tiên Ollama với model miễn phí/local (`qwen2.5:7b-instruct`, `gemma2:9b`) cho MVP, có thể mở rộng sang OpenAI/Azure OpenAI sau; prompt versioning lưu trong DB.
- Testing backend: JUnit 5, Spring Boot Test, Testcontainers cho PostgreSQL nếu cần integration test thực tế.
- Testing frontend: Jasmine/Karma hoặc Jest tùy scaffold Angular, Playwright cho e2e smoke test.
- Build và packaging: Docker, Docker Compose, GitHub Actions, GHCR hoặc Docker Hub để lưu image.
- Reverse proxy và TLS: Nginx + Let's Encrypt.



**Sprint Backlog**
1. Sprint 1 - Foundation và Crawl Core
1. Khởi tạo Angular, Spring Boot, PostgreSQL, Docker Compose, Flyway/Liquibase, cấu hình môi trường `dev`.
2. Hoàn thành schema `news_source`, `news_article`, `crawl_job`, `crawl_result`, `news_summary`, `summary_job`.
3. Cài đặt crawler framework, adapter mẫu cho 1-2 nguồn đầu tiên, robots cache, dedup, scheduler với ShedLock.
4. Hoàn thành public API tối thiểu cho home/list/detail.
5. Kết quả mong đợi: crawl được nguồn đầu tiên end-to-end và hiển thị được trên UI cơ bản.
2. Sprint 2 - Mở rộng nguồn và Admin/Crawl Data
1. Mở rộng đủ 5 nguồn crawl, thêm re-crawl, retention policy, log lỗi theo nguồn.
2. Hoàn thiện admin sources, admin crawl data, dashboard crawl metrics.
3. Thêm auth JWT cho admin, rate-limit và validation.
4. Kết quả mong đợi: đội vận hành có thể quản trị nguồn, theo dõi job, và trigger crawl thủ công.
3. Sprint 3 - AI Summarize và Review Flow
1. Tích hợp `SummaryProvider`, summary worker, queue `summary_job`, prompt versioning, review status.
2. Hoàn thiện summary API, admin summaries, hiển thị summary trên home/detail/dashboard.
3. Thêm quality checks cho summary, ngân sách token/ngày, retry policy theo provider.
4. Kết quả mong đợi: bài viết mới được summarize tự động, admin có thể retry/review khi lỗi.
4. Sprint 4 - Hardening và Production Readiness
1. Hoàn thiện test suite, observability, alerting, healthcheck, backup/restore DB.
2. Thiết lập GitHub Actions, deploy staging/production lên EC2, Nginx reverse proxy, HTTPS, rollback.
3. Chạy load/smoke test và kiểm tra quy trình release.
4. Kết quả mong đợi: hệ thống sẵn sàng vận hành production với quy trình release lặp lại được.

**Deployment Strategy**
- Mô hình triển khai khuyến nghị cho MVP: 1 EC2 `staging`, 1 EC2 `production`, PostgreSQL tách riêng trên RDS nếu ngân sách cho phép; nếu chưa, có thể dùng PostgreSQL cùng host staging trong giai đoạn sớm nhưng không khuyến nghị cho production.
- Thành phần trên EC2 production: Nginx reverse proxy, Angular static build, Spring Boot API container/service, worker summarize/crawler, Playwright runtime chỉ bật ở node cần thiết.
- Kiểu deploy khuyến nghị: Docker Compose trên EC2 để đơn giản hóa rollout; mỗi deploy pull image mới, chạy migration, recreate service backend/worker, giữ nguyên Nginx.
- Chiến lược release: `main` -> deploy `staging` tự động, `tag v*` hoặc `workflow_dispatch` -> deploy `production` có approval.
- Zero/low downtime cho MVP: rollout tuần tự backend rồi frontend, thêm healthcheck `/actuator/health`, chỉ chuyển traffic sau khi backend healthy.
- Rollback: giữ 1-2 image tag trước đó trên EC2; workflow có bước chọn tag cũ và chạy lại compose với image cũ.

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
1. `EC2_HOST_STAGING`, `EC2_HOST_PROD`, `EC2_SSH_USER`, `EC2_SSH_KEY`.
2. `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` theo từng environment.
3. `JWT_SECRET`, `OPENAI_API_KEY` hoặc `AZURE_OPENAI_*`, `GITHUB_TOKEN`/`GHCR_TOKEN`.
4. Biến frontend như `ANGULAR_API_BASE_URL`, `ANGULAR_ENV`.

**Technical Requirements**
- EC2 staging tối thiểu: 2 vCPU, 4 GB RAM, 40-60 GB SSD; production tối thiểu: 4 vCPU, 8 GB RAM, 80+ GB SSD nếu crawler và summarize chạy cùng máy.
- OS khuyến nghị: Ubuntu 22.04 LTS, Docker Engine + Docker Compose plugin, Nginx, OpenJDK 21, Node 20 LTS cho build runner.
- Nếu dùng Playwright trên production node: cần thêm dependency system packages và tăng RAM tối thiểu lên 8 GB.
- Nếu chạy Ollama trên cùng máy production: khuyến nghị tăng lên ít nhất 8-16 GB RAM; nếu máy yếu thì tách summarize sang node riêng hoặc tắt auto-summary theo batch lớn.
- Domain và TLS: dùng Route53 hoặc DNS bất kỳ, HTTPS qua Let's Encrypt/Nginx.
- Database: PostgreSQL 16, bật backup hằng ngày, retention log tối thiểu 7-14 ngày.
- Observability tối thiểu: application logs, Nginx logs, disk/RAM/CPU metrics, alert khi crawl error rate hoặc summarize failure rate vượt ngưỡng.
- Bảo mật tối thiểu: chỉ mở port 80/443 công khai; port 22 giới hạn IP quản trị; backend/DB không public Internet; secrets không commit vào repo.
- NFR mục tiêu cho MVP: thời gian crawl một chu kỳ dưới 15 phút với 5 nguồn, tỉ lệ crawl thành công trên 95%, summary latency trung bình dưới 60 giây mỗi batch nhỏ, thời gian phục hồi deploy dưới 10 phút.

**Further Considerations**
1. Khuyến nghị ưu tiên Azure OpenAI hoặc OpenAI cho MVP để giảm thời gian tích hợp; chỉ cân nhắc local model khi đã rõ yêu cầu chi phí và hạ tầng GPU.
2. Thiết lập ngân sách summarize theo ngày, giới hạn số bài được summarize mỗi chu kỳ, và policy retry tối đa để tránh bùng chi phí.
3. Cân nhắc chính sách lưu ảnh: lưu URL gốc ở MVP, chỉ tải về object storage nếu có yêu cầu chống link chết hoặc cần CDN nội bộ.