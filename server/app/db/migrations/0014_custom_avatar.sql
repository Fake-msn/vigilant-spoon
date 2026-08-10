-- 0014: students 表增加 custom_avatar_url 字段，支持学生自定义头像

ALTER TABLE students ADD COLUMN custom_avatar_url TEXT;
