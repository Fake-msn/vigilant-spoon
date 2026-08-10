-- 0013 down: 移除 classes 表的 city/county/town 字段
-- SQLite 不支持 DROP COLUMN（3.35+ 支持但兼容性差），用重建表方式

CREATE TABLE IF NOT EXISTS classes_new (
    class_code TEXT PRIMARY KEY,
    class_name TEXT NOT NULL,
    school TEXT NOT NULL,
    region_key TEXT NOT NULL,
    grade TEXT NOT NULL,
    class_no TEXT NOT NULL
);

INSERT INTO classes_new (class_code, class_name, school, region_key, grade, class_no)
SELECT class_code, class_name, school, region_key, grade, class_no FROM classes;

DROP TABLE classes;
ALTER TABLE classes_new RENAME TO classes;
