-- Rollback: remove history column from growth_records
-- SQLite does not support DROP COLUMN, recreate the table.

CREATE TABLE growth_records_new (
    student_id TEXT PRIMARY KEY REFERENCES students(student_id),
    ideal TEXT,
    commitments TEXT,
    actions TEXT,
    stage TEXT,
    pet_state TEXT,
    last_gist TEXT,
    needs_care INTEGER NOT NULL DEFAULT 0,
    teacher_constraints TEXT,
    state TEXT NOT NULL CHECK(state IN ('daily','gray','cheer')),
    signal TEXT,
    growth_value INTEGER NOT NULL DEFAULT 0,
    species TEXT NOT NULL DEFAULT 'cat',
    pet_stage INTEGER NOT NULL DEFAULT 0,
    last_growth_at TIMESTAMP,
    cheer_until TIMESTAMP,
    portrait_url TEXT
);

INSERT INTO growth_records_new SELECT
    student_id, ideal, commitments, actions, stage, pet_state,
    last_gist, needs_care, teacher_constraints, state, signal,
    growth_value, species, pet_stage, last_growth_at, cheer_until, portrait_url
FROM growth_records;

DROP TABLE growth_records;
ALTER TABLE growth_records_new RENAME TO growth_records;
