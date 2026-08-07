-- 教师账号体系：教师档案 + 教师-班级关联
-- 支持教师登录时录入姓名，并在后台管理多个任教班级

CREATE TABLE IF NOT EXISTS teachers (
    teacher_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    school TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teacher_classes (
    teacher_id TEXT NOT NULL REFERENCES teachers(teacher_id),
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (teacher_id, class_code)
);