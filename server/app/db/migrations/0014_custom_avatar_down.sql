-- 0014 down: 移除 students 表的 custom_avatar_url 字段
-- SQLite 不支持 DROP COLUMN（3.35+ 支持），这里用安全的方式处理

ALTER TABLE students DROP COLUMN custom_avatar_url;
