-- 教师账号体系 v2：可选个人信息 + 可选密码
-- 账号需先注册，登录时校验；支持密码登录。
ALTER TABLE teachers ADD COLUMN phone TEXT;
ALTER TABLE teachers ADD COLUMN subject TEXT;
ALTER TABLE teachers ADD COLUMN title TEXT;
ALTER TABLE teachers ADD COLUMN password_hash TEXT;