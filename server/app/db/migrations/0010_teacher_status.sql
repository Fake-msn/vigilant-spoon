-- 教师账号审批：新增状态与驳回原因
-- status: pending（待管理员审核）/ active（已通过）/ rejected（已驳回）
-- 已有账号默认 active，新注册账号由后端显式写入 pending。
ALTER TABLE teachers ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE teachers ADD COLUMN reject_reason TEXT;