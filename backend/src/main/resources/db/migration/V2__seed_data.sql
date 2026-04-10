-- V2: Seed default data

-- Default app config
INSERT INTO app_config (key, value, value_type, description) VALUES
    ('auto_summary_enabled',          'false',  'BOOLEAN', 'Enable automatic AI summarization for new articles'),
    ('summary_daily_limit',           '500',    'INT',     'Max summary jobs per day'),
    ('crawl_default_interval_minutes','60',     'INT',     'Default crawl interval for new sources'),
    ('summary_daily_budget_usd',      '5.0',    'STRING',  'Max USD budget for AI summarization per day'),
    ('summary_max_requests_per_hour', '50',     'INT',     'Max AI API requests per hour')
ON CONFLICT (key) DO NOTHING;

-- Default root categories
INSERT INTO category (name, slug, parent_id, display_order, is_active) VALUES
    ('Thời sự',       'thoi-su',       NULL, 1,  true),
    ('Thế giới',      'the-gioi',      NULL, 2,  true),
    ('Kinh tế',       'kinh-te',       NULL, 3,  true),
    ('Công nghệ',     'cong-nghe',     NULL, 4,  true),
    ('Thể thao',      'the-thao',      NULL, 5,  true),
    ('Giải trí',      'giai-tri',      NULL, 6,  true),
    ('Sức khỏe',      'suc-khoe',      NULL, 7,  true),
    ('Giáo dục',      'giao-duc',      NULL, 8,  true),
    ('Du lịch',       'du-lich',       NULL, 9,  true),
    ('Bất động sản',  'bat-dong-san',  NULL, 10, true)
ON CONFLICT (slug) DO NOTHING;

-- Default news sources (5 sources)
INSERT INTO news_source (name, slug, base_url, home_url, logo_url, description, is_active, crawl_interval_minutes) VALUES
    ('VnExpress',
     'vnexpress',
     'https://vnexpress.net',
     'https://vnexpress.net',
     'https://s1.vnecdn.net/vnexpress/restruct/i/v9278/v2_2019/pc/graphics/logo.svg',
     'Báo tin tức online nhiều người đọc nhất Việt Nam',
     true, 45),

    ('Tuổi Trẻ Online',
     'tuoitre',
     'https://tuoitre.vn',
     'https://tuoitre.vn',
     'https://static.tuoitre.vn/tto/i/s626/2021/05/11/logo-tuoi-tre-1620744352.png',
     'Báo Tuổi Trẻ Online',
     true, 45),

    ('Thanh Niên',
     'thanhnien',
     'https://thanhnien.vn',
     'https://thanhnien.vn',
     '',
     'Báo Thanh Niên Online',
     true, 60),

    ('Dân Trí',
     'dantri',
     'https://dantri.com.vn',
     'https://dantri.com.vn',
     '',
     'Báo điện tử Dân Trí',
     true, 60),

    ('Kenh14',
     'kenh14',
     'https://kenh14.vn',
     'https://kenh14.vn',
     '',
     'Thông tin giải trí, Kenh14',
     true, 60)
ON CONFLICT (slug) DO NOTHING;
