-- V3: Database views for optimized queries

-- ============================================================
-- v_article_card: article card data for home/list/category pages
-- ============================================================
CREATE OR REPLACE VIEW v_article_card AS
SELECT
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.image_url,
    a.image_alt,
    a.author,
    a.published_at,
    a.first_crawled_at,
    a.view_count,
    a.status,
    a.is_summarized,
    a.source_url,
    a.tags,

    -- Source info
    s.id         AS source_id,
    s.name       AS source_name,
    s.slug       AS source_slug,
    s.logo_url   AS source_logo_url,

    -- Category info
    c.id         AS category_id,
    c.name       AS category_name,
    c.slug       AS category_slug,

    -- Summary info
    ns.short_summary,
    ns.standard_summary,
    ns.review_status AS summary_review_status

FROM news_article a
JOIN news_source s ON a.source_id = s.id
LEFT JOIN category c ON a.category_id = c.id
LEFT JOIN news_summary ns ON ns.article_id = a.id AND ns.review_status IN ('APPROVED', 'EDITED');

-- ============================================================
-- v_source_health: source health for dashboard
-- ============================================================
CREATE OR REPLACE VIEW v_source_health AS
SELECT
    s.id                                              AS source_id,
    s.name                                            AS source_name,
    s.slug                                            AS source_slug,
    s.is_active,
    s.last_crawled_at,
    s.last_success_at,
    s.consecutive_fail_count,
    COUNT(CASE WHEN j.status = 'SUCCESS' AND j.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) AS success_count_7d,
    COUNT(CASE WHEN j.status = 'FAILED'  AND j.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) AS fail_count_7d,
    AVG(CASE WHEN j.created_at >= NOW() - INTERVAL '7 days' THEN j.duration_ms END)               AS avg_duration_ms,
    SUM(CASE WHEN j.created_at >= NOW() - INTERVAL '7 days' THEN COALESCE(j.articles_new, 0) END)  AS articles_new_7d
FROM news_source s
LEFT JOIN crawl_job j ON j.source_id = s.id
GROUP BY s.id, s.name, s.slug, s.is_active, s.last_crawled_at, s.last_success_at, s.consecutive_fail_count;

-- ============================================================
-- v_crawl_daily_stats: daily crawl stats for dashboard charts
-- ============================================================
CREATE OR REPLACE VIEW v_crawl_daily_stats AS
SELECT
    DATE(j.started_at AT TIME ZONE 'Asia/Ho_Chi_Minh') AS crawl_date,
    s.name                                              AS source_name,
    s.slug                                              AS source_slug,
    COUNT(j.id)                                         AS total_jobs,
    SUM(COALESCE(j.articles_found, 0))                  AS articles_found,
    SUM(COALESCE(j.articles_new, 0))                    AS articles_new,
    SUM(COALESCE(j.articles_failed, 0))                 AS articles_failed,
    AVG(j.duration_ms)                                  AS avg_duration_ms
FROM crawl_job j
JOIN news_source s ON j.source_id = s.id
WHERE j.started_at IS NOT NULL
GROUP BY DATE(j.started_at AT TIME ZONE 'Asia/Ho_Chi_Minh'), s.name, s.slug
ORDER BY crawl_date DESC;

-- ============================================================
-- v_summary_metrics: summary job metrics for dashboard
-- ============================================================
CREATE OR REPLACE VIEW v_summary_metrics AS
SELECT
    sj.status,
    sj.trigger_mode,
    ns.model_name,
    COUNT(sj.id)                  AS job_count,
    AVG(ns.generation_latency_ms) AS avg_latency_ms,
    SUM(ns.token_count)           AS total_tokens
FROM summary_job sj
LEFT JOIN news_summary ns ON ns.article_id = sj.article_id
GROUP BY sj.status, sj.trigger_mode, ns.model_name;

-- ============================================================
-- v_trending_articles: materialized view for trending (hot) articles
-- Refresh every 30 minutes via scheduled job
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS v_trending_articles AS
SELECT
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.image_url,
    a.published_at,
    a.source_id,
    a.view_count,
    a.crawl_count,
    (a.view_count * 0.6 + a.crawl_count * 0.4) AS trending_score,
    ns.short_summary
FROM news_article a
LEFT JOIN news_summary ns ON ns.article_id = a.id AND ns.review_status IN ('APPROVED', 'EDITED')
WHERE a.published_at >= NOW() - INTERVAL '48 hours'
  AND a.status = 'ACTIVE'
ORDER BY trending_score DESC
LIMIT 20;

CREATE UNIQUE INDEX ON v_trending_articles(id);
