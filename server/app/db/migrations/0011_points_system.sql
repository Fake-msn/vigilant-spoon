-- 班宠积分制度：规则表 / 流水表 / 小组表 / 新字段

CREATE TABLE IF NOT EXISTS point_rules (
    rule_id TEXT PRIMARY KEY,
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    name TEXT NOT NULL,
    points INTEGER NOT NULL,
    category TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_point_rules_class ON point_rules(class_code);

CREATE TABLE IF NOT EXISTS point_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL REFERENCES students(student_id),
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    rule_id TEXT,
    name TEXT NOT NULL,
    points INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_point_ledger_class ON point_ledger(class_code);
CREATE INDEX IF NOT EXISTS idx_point_ledger_student ON point_ledger(student_id);

CREATE TABLE IF NOT EXISTS groups (
    group_id TEXT PRIMARY KEY,
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    group_name TEXT NOT NULL,
    color TEXT
);
CREATE INDEX IF NOT EXISTS idx_groups_class ON groups(class_code);

ALTER TABLE students ADD COLUMN group_id TEXT;

ALTER TABLE growth_records ADD COLUMN points_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE growth_records ADD COLUMN level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE growth_records ADD COLUMN hunger INTEGER NOT NULL DEFAULT 50;
ALTER TABLE growth_records ADD COLUMN mood INTEGER NOT NULL DEFAULT 60;
ALTER TABLE growth_records ADD COLUMN last_points_at TIMESTAMP;