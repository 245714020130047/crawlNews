-- V1: Create all tables
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE scheduler_configs (
    id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(50) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    cron_expression VARCHAR(100) NOT NULL,
    updated_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id BIGINT REFERENCES categories(id),
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    auto_created BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE articles (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    summary TEXT,
    content TEXT,
    thumbnail_url VARCHAR(1000),
    source_url VARCHAR(1000) NOT NULL UNIQUE,
    source_name VARCHAR(50) NOT NULL,
    category_id BIGINT REFERENCES categories(id),
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    view_count BIGINT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE category_mappings (
    id BIGSERIAL PRIMARY KEY,
    source_name VARCHAR(50) NOT NULL,
    source_category VARCHAR(200) NOT NULL,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (source_name, source_category)
);

CREATE TABLE crawl_configs (
    id BIGSERIAL PRIMARY KEY,
    source_name VARCHAR(50) NOT NULL UNIQUE,
    base_url VARCHAR(500) NOT NULL,
    rss_url VARCHAR(500) NOT NULL,
    selectors JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    crawl_interval_minutes INT NOT NULL DEFAULT 30,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE crawl_logs (
    id BIGSERIAL PRIMARY KEY,
    crawl_config_id BIGINT NOT NULL REFERENCES crawl_configs(id),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMP,
    articles_found INT NOT NULL DEFAULT 0,
    articles_saved INT NOT NULL DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'RUNNING'
);

CREATE TABLE ai_configs (
    id BIGSERIAL PRIMARY KEY,
    provider VARCHAR(20) NOT NULL,
    api_key_encrypted VARCHAR(500),
    model_name VARCHAR(100) NOT NULL,
    max_tokens INT NOT NULL DEFAULT 500,
    temperature DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    prompt_template TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE article_views (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT NOT NULL REFERENCES articles(id),
    ip_address INET NOT NULL,
    user_agent VARCHAR(500),
    city VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100),
    geo_data JSONB DEFAULT '{}'::jsonb,
    viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id BIGINT REFERENCES users(id)
);

CREATE TABLE ip_blacklist (
    id BIGSERIAL PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    reason VARCHAR(500),
    blocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    blocked_until TIMESTAMP,
    created_by BIGINT REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_source ON articles(source_name);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_metadata ON articles USING GIN(metadata);
CREATE INDEX idx_article_views_dedup ON article_views(article_id, ip_address, viewed_at);
CREATE INDEX idx_article_views_date ON article_views(viewed_at);
CREATE INDEX idx_crawl_logs_config ON crawl_logs(crawl_config_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_category_mappings_lookup ON category_mappings(source_name, source_category);

-- Full-text search
ALTER TABLE articles ADD COLUMN search_vector tsvector;
CREATE INDEX idx_articles_fts ON articles USING GIN(search_vector);

CREATE OR REPLACE FUNCTION articles_search_trigger() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'C');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvector_update BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION articles_search_trigger();
