-- V4: Seed category mappings for known source categories
-- VnExpress mappings
INSERT INTO category_mappings (source_name, source_category, category_id) VALUES
    ('vnexpress', 'thoi-su', (SELECT id FROM categories WHERE slug = 'thoi-su')),
    ('vnexpress', 'the-gioi', (SELECT id FROM categories WHERE slug = 'the-gioi')),
    ('vnexpress', 'kinh-doanh', (SELECT id FROM categories WHERE slug = 'kinh-doanh')),
    ('vnexpress', 'the-thao', (SELECT id FROM categories WHERE slug = 'the-thao')),
    ('vnexpress', 'giai-tri', (SELECT id FROM categories WHERE slug = 'giai-tri')),
    ('vnexpress', 'cong-nghe', (SELECT id FROM categories WHERE slug = 'cong-nghe')),
    ('vnexpress', 'giao-duc', (SELECT id FROM categories WHERE slug = 'giao-duc')),
    ('vnexpress', 'suc-khoe', (SELECT id FROM categories WHERE slug = 'suc-khoe')),
    ('vnexpress', 'doi-song', (SELECT id FROM categories WHERE slug = 'doi-song')),
    ('vnexpress', 'phap-luat', (SELECT id FROM categories WHERE slug = 'phap-luat')),
    ('vnexpress', 'du-lich', (SELECT id FROM categories WHERE slug = 'du-lich')),
    ('vnexpress', 'xe', (SELECT id FROM categories WHERE slug = 'xe'));

-- Tuổi Trẻ mappings
INSERT INTO category_mappings (source_name, source_category, category_id) VALUES
    ('tuoitre', 'thoi-su', (SELECT id FROM categories WHERE slug = 'thoi-su')),
    ('tuoitre', 'the-gioi', (SELECT id FROM categories WHERE slug = 'the-gioi')),
    ('tuoitre', 'kinh-doanh', (SELECT id FROM categories WHERE slug = 'kinh-doanh')),
    ('tuoitre', 'the-thao', (SELECT id FROM categories WHERE slug = 'the-thao')),
    ('tuoitre', 'giai-tri', (SELECT id FROM categories WHERE slug = 'giai-tri')),
    ('tuoitre', 'cong-nghe', (SELECT id FROM categories WHERE slug = 'cong-nghe')),
    ('tuoitre', 'giao-duc', (SELECT id FROM categories WHERE slug = 'giao-duc')),
    ('tuoitre', 'suc-khoe', (SELECT id FROM categories WHERE slug = 'suc-khoe')),
    ('tuoitre', 'du-lich', (SELECT id FROM categories WHERE slug = 'du-lich')),
    ('tuoitre', 'xe', (SELECT id FROM categories WHERE slug = 'xe'));

-- Thanh Niên mappings
INSERT INTO category_mappings (source_name, source_category, category_id) VALUES
    ('thanhnien', 'thoi-su', (SELECT id FROM categories WHERE slug = 'thoi-su')),
    ('thanhnien', 'the-gioi', (SELECT id FROM categories WHERE slug = 'the-gioi')),
    ('thanhnien', 'kinh-doanh', (SELECT id FROM categories WHERE slug = 'kinh-doanh')),
    ('thanhnien', 'the-thao', (SELECT id FROM categories WHERE slug = 'the-thao')),
    ('thanhnien', 'giai-tri', (SELECT id FROM categories WHERE slug = 'giai-tri')),
    ('thanhnien', 'cong-nghe', (SELECT id FROM categories WHERE slug = 'cong-nghe')),
    ('thanhnien', 'giao-duc', (SELECT id FROM categories WHERE slug = 'giao-duc')),
    ('thanhnien', 'suc-khoe', (SELECT id FROM categories WHERE slug = 'suc-khoe')),
    ('thanhnien', 'doi-song', (SELECT id FROM categories WHERE slug = 'doi-song'));

-- Dân Trí mappings
INSERT INTO category_mappings (source_name, source_category, category_id) VALUES
    ('dantri', 'xa-hoi', (SELECT id FROM categories WHERE slug = 'thoi-su')),
    ('dantri', 'the-gioi', (SELECT id FROM categories WHERE slug = 'the-gioi')),
    ('dantri', 'kinh-doanh', (SELECT id FROM categories WHERE slug = 'kinh-doanh')),
    ('dantri', 'the-thao', (SELECT id FROM categories WHERE slug = 'the-thao')),
    ('dantri', 'giai-tri', (SELECT id FROM categories WHERE slug = 'giai-tri')),
    ('dantri', 'suc-khoe', (SELECT id FROM categories WHERE slug = 'suc-khoe')),
    ('dantri', 'giao-duc-huong-nghiep', (SELECT id FROM categories WHERE slug = 'giao-duc')),
    ('dantri', 'du-lich', (SELECT id FROM categories WHERE slug = 'du-lich')),
    ('dantri', 'o-to-xe-may', (SELECT id FROM categories WHERE slug = 'xe'));
