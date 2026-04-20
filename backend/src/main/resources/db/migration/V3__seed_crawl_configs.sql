-- V3: Seed crawl configs for 4 Vietnamese news sources
INSERT INTO crawl_configs (source_name, base_url, rss_url, selectors, active, crawl_interval_minutes) VALUES
(
    'vnexpress',
    'https://vnexpress.net',
    'https://vnexpress.net/rss/tin-moi-nhat.rss',
    '{
        "title": "h1.title-detail",
        "content": "article.fck_detail",
        "thumbnail": "meta[property=og:image]",
        "category": "ul.breadcrumb li:nth-child(2) a",
        "author": "p.Normal[style*=text-align:right], span.author_mail",
        "published_date": "span.date"
    }'::jsonb,
    true, 30
),
(
    'tuoitre',
    'https://tuoitre.vn',
    'https://tuoitre.vn/rss/tin-moi-nhat.rss',
    '{
        "title": "h1.detail-title",
        "content": "div.detail-content",
        "thumbnail": "meta[property=og:image]",
        "category": "div.bread-crumb a:nth-child(2)",
        "author": "div.author-info span",
        "published_date": "div.detail-time"
    }'::jsonb,
    true, 30
),
(
    'thanhnien',
    'https://thanhnien.vn',
    'https://thanhnien.vn/rss/home.rss',
    '{
        "title": "h1.detail-title",
        "content": "div.detail-content",
        "thumbnail": "meta[property=og:image]",
        "category": "div.breadcrumbs a:nth-child(2)",
        "author": "div.author-info a.author-name",
        "published_date": "div.detail-time"
    }'::jsonb,
    true, 30
),
(
    'dantri',
    'https://dantri.com.vn',
    'https://dantri.com.vn/rss/home.rss',
    '{
        "title": "h1.title-page",
        "content": "div.singular-content",
        "thumbnail": "meta[property=og:image]",
        "category": "ul.breadcrumb li:nth-child(2) a",
        "author": "span.author-name",
        "published_date": "time.author-time"
    }'::jsonb,
    true, 30
);
