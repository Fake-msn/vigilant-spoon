-- 0013: classes 表增加 city/county/town 字段，支持完整地区信息回填
-- 使用 try 风格：仅当列不存在时才添加（兼容旧版 SQLite，不支持 ADD COLUMN IF NOT EXISTS）

-- 注意：该迁移通过 Python 侧 _safe_add_column 包装调用，自动忽略 "duplicate column name" 错误。
-- 这里直接用标准 ALTER TABLE 语句，重复执行幂等性由 app/db/migrate.py 保证。

ALTER TABLE classes ADD COLUMN city TEXT NOT NULL DEFAULT '';
ALTER TABLE classes ADD COLUMN county TEXT NOT NULL DEFAULT '';
ALTER TABLE classes ADD COLUMN town TEXT NOT NULL DEFAULT '';
