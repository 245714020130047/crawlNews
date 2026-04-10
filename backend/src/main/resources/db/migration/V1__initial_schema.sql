-- V1: Initial schema for CrawlNews platform
-- Timezone: Asia/Ho_Chi_Minh (UTC+7), stored as TIMESTAMPTZ (UTC in DB)

SET timezone = 'UTC';

-- ============================================================
-- news_source
-- ============================================================
CREATE TABLE news_source (
    id                       BIGSERIAL PRIMARY KEY,
    name                     VARCHAR(100)  NOT NULL,
    slug                     VARCHAR(100)  NOT NULL UNIQUE,
    base_url                 VARCHAR(500)  NOT NULL,
    home_url                 VARCHAR(500),
    logo_url                 VARCHAR(500),
    description              TEXT,
    is_active                BOOLEAN       NOT NULL DEFAULT TRUE,
    crawl_interval_minutes   INT           DEFAULT 60,
    user_agent               VARCHAR(300),
    last_crawled_at          TIMESTAMPTZ,
    last_success_at          TIMESTAMPTZ,
    consecutive_fail_count   INT           DEFAULT 0,
    robots_cache_ttl_seconds INT           DEFAULT 3600,
    created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- category (2-level tree: parent -> child)
-- ============================================================
CREATE TABLE category (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    slug          VARCHAR(100) NOT NULL UNIQUE,
    parent_id     BIGINT REFERENCES category(id) ON DELETE SET NULL,
    display_order INT          DEFAULT 0,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_category_no_self_parent CHECK (parent_id <> id)
);

CREATE INDEX idx_category_parent ON category(parent_id);
CREATE INDEX idx_category_active ON category(is_active, display_order);

-- ============================================================
-- news_article (core table)
-- ============================================================
CREATE TABLE news_article (
    id                    BIGSERIAL PRIMARY KEY,
    source_id             BIGINT        NOT NULL REFERENCES news_source(id),
    category_id           BIGINT        REFERENCES category(id) ON DELETE SET NULL,

    -- Content
    title                 VARCHAR(1000) NOT NULL,
    slug                  VARCHAR(1100) UNIQUE,
    excerpt               TEXT,
    content_html          TEXT,
    content_text          TEXT,
    author                VARCHAR(300),
    image_url             VARCHAR(500),
    image_alt             VARCHAR(300),
    tags                  TEXT[],

    -- URL / dedup
    source_url            VARCHAR(2000) NOT NULL,
    normalized_source_url VARCHAR(2000) UNIQUE,
    canonical_url         VARCHAR(2000),
    content_fingerprint   VARCHAR(64),
    simhash_value         BIGINT,

    -- Timestamps
    published_at          TIMESTAMPTZ,
    first_crawled_at      TIMESTAMPTZ   DEFAULT NOW(),
    last_crawled_at       TIMESTAMPTZ,
    crawl_count           INT           DEFAULT 1,

    -- Status
    view_count            INT           DEFAULT 0,
    status                VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE'
                          CHECK (status IN ('ACTIVE', 'HIDDEN', 'DUPLICATE', 'ARCHIVED')),
    is_summarized         BOOLEAN       DEFAULT FALSE,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_article_canonical_url ON news_article(canonical_url)
    WHERE canonical_url IS NOT NULL;
CREATE INDEX idx_article_source_published ON news_article(source_id, published_at DESC);
CREATE INDEX idx_article_category_published ON news_article(category_id, published_at DESC);
CREATE INDEX idx_article_status_published ON news_article(status, published_at DESC);
CREATE INDEX idx_article_summarized ON news_article(is_summarized, published_at DESC);
CREATE INDEX idx_article_fingerprint ON news_article(content_fingerprint);
CREATE INDEX idx_article_tags ON news_article USING GIN(tags);

-- ============================================================
-- crawl_job
-- ============================================================
CREATE TABLE crawl_job (
    id                 BIGSERIAL PRIMARY KEY,
    source_id          BIGINT      NOT NULL REFERENCES news_source(id),
    job_type           VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
                       CHECK (job_type IN ('SCHEDULED', 'MANUAL', 'RETRY')),
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL')),
    trigger_type       VARCHAR(10),
    triggered_by       VARCHAR(200),
    parser_version     VARCHAR(50),
    articles_found     INT         DEFAULT 0,
    articles_new       INT         DEFAULT 0,
    articles_updated   INT         DEFAULT 0,
    articles_skipped   INT         DEFAULT 0,
    articles_failed    INT         DEFAULT 0,
    robots_checked     BOOLEAN     DEFAULT FALSE,
    robots_allowed     BOOLEAN,
    error_message      TEXT,
    started_at         TIMESTAMPTZ,
    finished_at        TIMESTAMPTZ,
    duration_ms        BIGINT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawl_job_source ON crawl_job(source_id, created_at DESC);
CREATE INDEX idx_crawl_job_status ON crawl_job(status, created_at DESC);

-- ============================================================
-- crawl_result (per-article log)
-- ============================================================
CREATE TABLE crawl_result (
    id               BIGSERIAL PRIMARY KEY,
    crawl_job_id     BIGINT      NOT NULL REFERENCES crawl_job(id),
    article_id       BIGINT      REFERENCES news_article(id) ON DELETE SET NULL,
    source_url       VARCHAR(2000) NOT NULL,
    result           VARCHAR(20) NOT NULL
                     CHECK (result IN ('NEW', 'UPDATED', 'DUPLICATE', 'SKIPPED', 'FAILED', 'ROBOTS_BLOCKED')),
    http_status      INT,
    response_time_ms INT,
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawl_result_job ON crawl_result(crawl_job_id);
CREATE INDEX idx_crawl_result_article ON crawl_result(article_id);

-- ============================================================
-- news_summary (1 per article)
-- ============================================================
CREATE TABLE news_summary (
    id                    BIGSERIAL PRIMARY KEY,
    article_id            BIGINT      NOT NULL UNIQUE REFERENCES news_article(id),
    short_summary         TEXT,
    standard_summary      TEXT,
    model_name            VARCHAR(100),
    model_version         VARCHAR(50),
    prompt_version        VARCHAR(20),
    trigger_mode          VARCHAR(10) CHECK (trigger_mode IN ('AUTO', 'MANUAL')),
    review_status         VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW'
                          CHECK (review_status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EDITED')),
    reviewed_by           VARCHAR(200),
    reviewed_at           TIMESTAMPTZ,
    generated_at          TIMESTAMPTZ,
    token_count           INT,
    generation_latency_ms INT,
    retry_count           INT         DEFAULT 0,
    error_message         TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- summary_job (queue)
-- ============================================================
CREATE TABLE summary_job (
    id            BIGSERIAL PRIMARY KEY,
    article_id    BIGINT      NOT NULL REFERENCES news_article(id),
    priority      INT         DEFAULT 5,
    status        VARCHAR(20) NOT NULL DEFAULT 'QUEUED'
                  CHECK (status IN ('QUEUED', 'PROCESSING', 'DONE', 'FAILED', 'CANCELLED')),
    trigger_mode  VARCHAR(10) CHECK (trigger_mode IN ('AUTO', 'MANUAL')),
    triggered_by  VARCHAR(200),
    max_retries   INT         DEFAULT 3,
    retry_count   INT         DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    locked_at     TIMESTAMPTZ,
    locked_by     VARCHAR(200),
    error_message TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_retry_limit CHECK (retry_count <= max_retries)
);

CREATE INDEX idx_summary_job_polling ON summary_job(status, priority, created_at);
CREATE INDEX idx_summary_job_article ON summary_job(article_id);

-- ============================================================
-- article_duplicate_map
-- ============================================================
CREATE TABLE article_duplicate_map (
    id                  BIGSERIAL PRIMARY KEY,
    original_article_id BIGINT      NOT NULL REFERENCES news_article(id),
    duplicate_article_id BIGINT     NOT NULL UNIQUE REFERENCES news_article(id),
    merge_reason        VARCHAR(50) CHECK (merge_reason IN ('SAME_URL', 'SAME_FINGERPRINT', 'NEAR_DUP')),
    confidence          FLOAT,
    detected_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- app_config (feature flags + runtime settings)
-- ============================================================
CREATE TABLE app_config (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT        NOT NULL,
    value_type  VARCHAR(20) NOT NULL DEFAULT 'STRING'
                CHECK (value_type IN ('STRING', 'BOOLEAN', 'INT', 'JSON')),
    description TEXT,
    updated_by  VARCHAR(200),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ShedLock table (for distributed scheduling)
-- ============================================================
CREATE TABLE shedlock (
    name       VARCHAR(64)  NOT NULL,
    lock_until TIMESTAMPTZ  NOT NULL,
    locked_at  TIMESTAMPTZ  NOT NULL,
    locked_by  VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);
