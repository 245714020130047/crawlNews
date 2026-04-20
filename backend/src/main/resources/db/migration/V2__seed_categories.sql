-- V2: Seed Vietnamese news categories
INSERT INTO categories (name, slug, description, sort_order, active) VALUES
    ('Thời sự', 'thoi-su', 'Tin tức thời sự trong nước và quốc tế', 1, true),
    ('Kinh doanh', 'kinh-doanh', 'Tin tức kinh tế, tài chính, doanh nghiệp', 2, true),
    ('Thể thao', 'the-thao', 'Tin tức thể thao trong nước và quốc tế', 3, true),
    ('Giải trí', 'giai-tri', 'Tin tức giải trí, showbiz, âm nhạc', 4, true),
    ('Công nghệ', 'cong-nghe', 'Tin tức công nghệ, khoa học', 5, true),
    ('Giáo dục', 'giao-duc', 'Tin tức giáo dục, đào tạo', 6, true),
    ('Sức khỏe', 'suc-khoe', 'Tin tức sức khỏe, y tế', 7, true),
    ('Đời sống', 'doi-song', 'Tin tức đời sống, xã hội', 8, true),
    ('Thế giới', 'the-gioi', 'Tin tức quốc tế', 9, true),
    ('Pháp luật', 'phap-luat', 'Tin tức pháp luật', 10, true),
    ('Du lịch', 'du-lich', 'Tin tức du lịch', 11, true),
    ('Xe', 'xe', 'Tin tức xe cộ, ô tô, xe máy', 12, true);
