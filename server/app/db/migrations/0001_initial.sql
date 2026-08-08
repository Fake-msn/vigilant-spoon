-- Initial schema for 小信 backend v2.1 (F0)

CREATE TABLE IF NOT EXISTS classes (
    class_code TEXT PRIMARY KEY,
    class_name TEXT NOT NULL,
    school TEXT NOT NULL,
    region_key TEXT NOT NULL,
    grade TEXT NOT NULL,
    class_no TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    student_id TEXT PRIMARY KEY,
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    student_no TEXT NOT NULL UNIQUE,
    ideal TEXT,
    avatar_seed INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('member','group_leader','class_committee','subject_rep'))
);

CREATE TABLE IF NOT EXISTS academic_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL REFERENCES students(student_id),
    scores TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('member','group_leader','class_committee','subject_rep')),
    teacher_note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_records (
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
    signal TEXT
);

CREATE TABLE IF NOT EXISTS courses (
    course_id TEXT PRIMARY KEY,
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    topic TEXT NOT NULL,
    date TEXT NOT NULL,
    duration TEXT,
    joined INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('active','done')),
    goal TEXT NOT NULL,
    traces TEXT
);

CREATE TABLE IF NOT EXISTS letters (
    letter_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(student_id),
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    preview TEXT NOT NULL,
    body TEXT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source TEXT NOT NULL CHECK(source IN ('template','llm'))
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(student_id),
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    issued_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
