-- 方案 5.3：管理员后台 —— 模型服务配置存储 + 管理员会话

CREATE TABLE IF NOT EXISTS service_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    issued_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);