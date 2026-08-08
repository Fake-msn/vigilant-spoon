-- Classroom session state (R11/R12/R13) and demo teacher sessions

CREATE TABLE IF NOT EXISTS classroom_sessions (
    session_id TEXT PRIMARY KEY,
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    state TEXT NOT NULL CHECK(state IN ('idle','active','paused')),
    current_student TEXT REFERENCES students(student_id),
    current_slot TEXT,
    turn_count INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    processed_cmds TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_classroom_sessions_class ON classroom_sessions(class_code);

CREATE TABLE IF NOT EXISTS teacher_sessions (
    token TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    name TEXT NOT NULL,
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    issued_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teacher_sessions_class ON teacher_sessions(class_code);
