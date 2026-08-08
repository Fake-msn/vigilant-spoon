-- 回滚：移除教师账号个人信息与密码字段
ALTER TABLE teachers DROP COLUMN phone;
ALTER TABLE teachers DROP COLUMN subject;
ALTER TABLE teachers DROP COLUMN title;
ALTER TABLE teachers DROP COLUMN password_hash;