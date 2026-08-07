-- Growth / pet / job schema extensions for F3 (R3-R6, R17)

ALTER TABLE growth_records ADD COLUMN growth_value INTEGER NOT NULL DEFAULT 0;
ALTER TABLE growth_records ADD COLUMN species TEXT NOT NULL DEFAULT 'cat';
ALTER TABLE growth_records ADD COLUMN pet_stage INTEGER NOT NULL DEFAULT 0;
ALTER TABLE growth_records ADD COLUMN last_growth_at TIMESTAMP;
ALTER TABLE growth_records ADD COLUMN cheer_until TIMESTAMP;
ALTER TABLE growth_records ADD COLUMN portrait_url TEXT;

CREATE TABLE IF NOT EXISTS jobs (
    job_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(student_id),
    job_type TEXT NOT NULL CHECK(job_type IN ('portrait', 'letter', 'lesson')),
    status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'done', 'failed')),
    result_url TEXT,
    error_code TEXT,
    error_message TEXT,
    idempotency_key TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_student ON jobs(student_id);
CREATE INDEX IF NOT EXISTS idx_jobs_idempotency ON jobs(idempotency_key);

CREATE TABLE IF NOT EXISTS settlements (
    session_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(student_id),
    score_card TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);
