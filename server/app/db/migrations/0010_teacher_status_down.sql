-- 回滚：移除教师账号状态与驳回原因字段
ALTER TABLE teachers DROP COLUMN status;
ALTER TABLE teachers DROP COLUMN reject_reason;