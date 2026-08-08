-- F4 lesson / academic extensions (R9, R10, R14, R15, R16)

ALTER TABLE courses ADD COLUMN goals TEXT;
ALTER TABLE courses ADD COLUMN guidance_strategy TEXT;
ALTER TABLE courses ADD COLUMN materials TEXT;
ALTER TABLE courses ADD COLUMN created_at TIMESTAMP;

ALTER TABLE academic_records ADD COLUMN updated_at TIMESTAMP;
