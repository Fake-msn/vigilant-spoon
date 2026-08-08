-- 回滚班宠积分制度字段与表
ALTER TABLE growth_records DROP COLUMN last_points_at;
ALTER TABLE growth_records DROP COLUMN mood;
ALTER TABLE growth_records DROP COLUMN hunger;
ALTER TABLE growth_records DROP COLUMN level;
ALTER TABLE growth_records DROP COLUMN points_total;
ALTER TABLE students DROP COLUMN group_id;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS point_ledger;
DROP TABLE IF EXISTS point_rules;