-- 0003_growth down

DROP TABLE IF EXISTS settlements;
DROP TABLE IF EXISTS jobs;
DROP INDEX IF EXISTS idx_jobs_idempotency;
DROP INDEX IF EXISTS idx_jobs_student;

ALTER TABLE growth_records DROP COLUMN portrait_url;
ALTER TABLE growth_records DROP COLUMN cheer_until;
ALTER TABLE growth_records DROP COLUMN last_growth_at;
ALTER TABLE growth_records DROP COLUMN pet_stage;
ALTER TABLE growth_records DROP COLUMN species;
ALTER TABLE growth_records DROP COLUMN growth_value;
