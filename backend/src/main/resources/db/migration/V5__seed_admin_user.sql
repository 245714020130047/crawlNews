-- V5: Seed default admin account
-- Password: admin123 (BCrypt encoded)
INSERT INTO users (username, email, password_hash, role) VALUES
    ('admin', 'admin@vnnews.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN');
