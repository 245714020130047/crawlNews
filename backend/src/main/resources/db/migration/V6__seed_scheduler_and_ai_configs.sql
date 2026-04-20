-- V6: Seed scheduler configs and AI config
INSERT INTO scheduler_configs (job_name, enabled, cron_expression) VALUES
    ('CRAWL', true, '0 */30 * * * *'),
    ('SUMMARIZATION', true, '0 */5 * * * *');

INSERT INTO ai_configs (provider, model_name, max_tokens, temperature, active, prompt_template) VALUES
    ('GEMINI', 'gemini-2.5-flash', 500, 0.3, true,
     'Tóm tắt bài viết sau bằng tiếng Việt trong 2-3 câu ngắn gọn, giữ nguyên các thông tin quan trọng:\n\n{content}');
