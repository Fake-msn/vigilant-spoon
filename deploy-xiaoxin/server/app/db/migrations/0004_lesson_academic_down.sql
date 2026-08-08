-- Down migration for 0004_lesson_academic

ALTER TABLE courses DROP COLUMN goals;
ALTER TABLE courses DROP COLUMN guidance_strategy;
ALTER TABLE courses DROP COLUMN materials;
ALTER TABLE courses DROP COLUMN created_at;

ALTER TABLE academic_records DROP COLUMN updated_at;
