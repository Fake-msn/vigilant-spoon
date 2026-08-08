export interface paths {
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health */
        get: operations["health_api_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/classes/{class_code}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Class */
        get: operations["get_class_api_classes__class_code__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/classes/{class_code}/lessons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Class Lessons */
        get: operations["list_class_lessons_api_classes__class_code__lessons_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/classes/{class_code}/pets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Class Pets */
        get: operations["list_class_pets_api_classes__class_code__pets_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/classes/{class_code}/academic": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Class Academic */
        get: operations["list_class_academic_api_classes__class_code__academic_get"];
        put?: never;
        /** Import Class Academic */
        post: operations["import_class_academic_api_classes__class_code__academic_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/session/enter": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Enter */
        post: operations["enter_api_session_enter_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/students/{student_id}/growth": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Growth */
        get: operations["get_growth_api_students__student_id__growth_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/students/{student_id}/pet": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Pet */
        get: operations["get_pet_api_students__student_id__pet_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/students/{student_id}/pet/portrait": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Portrait */
        post: operations["create_portrait_api_students__student_id__pet_portrait_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/jobs/{job_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Job Status */
        get: operations["get_job_status_api_jobs__job_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/students/{student_id}/letters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Letters */
        get: operations["list_letters_api_students__student_id__letters_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/students/{student_id}/letters/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate Letters */
        post: operations["generate_letters_api_students__student_id__letters_generate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/lesson/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate Lesson */
        post: operations["generate_lesson_api_lesson_generate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/lessons/{lesson_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Lesson */
        get: operations["get_lesson_api_lessons__lesson_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/classes/{class_code}/session/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Start Session */
        post: operations["start_session_api_classes__class_code__session_start_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/classes/{class_code}/session/control": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Control Session */
        post: operations["control_session_api_classes__class_code__session_control_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/classes/{class_code}/session/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Session Status */
        get: operations["get_session_status_api_classes__class_code__session_status_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /**
         * AcademicRecord
         * @description R14/R15：学情档案。
         */
        AcademicRecord: {
            /**
             * Student Id
             * @description 学生 ID
             */
            student_id: string;
            /**
             * Student No
             * @description 学号
             */
            student_no: string;
            /**
             * Name
             * @description 姓名
             */
            name: string;
            /**
             * Role
             * @description 校内角色
             * @enum {string}
             */
            role: "member" | "group_leader" | "class_committee" | "subject_rep";
            /**
             * Scores
             * @description 各科成绩
             */
            scores: components["schemas"]["SubjectScore"][];
            /**
             * Teacher Note
             * @description 教师评语
             */
            teacher_note: string;
            /**
             * Updated At
             * Format: date-time
             * @description 更新时间
             */
            updated_at: string;
        };
        /**
         * AcademicSummary
         * @description R15：班级学情汇总。
         */
        AcademicSummary: {
            /**
             * Records
             * @description 学情记录列表
             */
            records: components["schemas"]["AcademicRecord"][];
            /**
             * Summary
             * @description 汇总统计
             */
            summary: {
                [key: string]: unknown;
            };
        };
        /**
         * ClassInfo
         * @description R1：班级与学生名单。
         */
        ClassInfo: {
            /**
             * Class Code
             * @description 班级码
             */
            class_code: string;
            /**
             * Class Name
             * @description 班级名称
             */
            class_name: string;
            /**
             * School
             * @description 学校
             */
            school: string;
            /**
             * Region Key
             * @description 地区 key
             */
            region_key: string;
            /**
             * Region Name
             * @description 地区名称
             */
            region_name: string;
            /**
             * Grade
             * @description 年级
             */
            grade: string;
            /**
             * Class No
             * @description 班级序号
             */
            class_no: string;
            /**
             * Students
             * @description 学生名单
             */
            students: components["schemas"]["StudentProfile"][];
        };
        /**
         * ClassPetView
         * @description R17：班级宠物墙单项（禁评分字段）。
         */
        ClassPetView: {
            /**
             * Student Id
             * @description 学生 ID
             */
            student_id: string;
            /**
             * Name
             * @description 姓名
             */
            name: string;
            /**
             * Avatar Seed
             * @description 头像种子
             */
            avatar_seed: number;
            /** @description 宠物状态 */
            pet: components["schemas"]["PetState"];
        };
        /**
         * ClassroomStatus
         * @description R11/R12/R13：课堂状态。
         */
        ClassroomStatus: {
            /**
             * Session Id
             * @description 课堂会话 ID
             */
            session_id: string;
            /**
             * State
             * @description 课堂状态
             * @enum {string}
             */
            state: "idle" | "active" | "paused";
            /**
             * Current Student
             * @description 当前轮到的学生
             */
            current_student?: string | null;
            /**
             * Current Slot
             * @description 当前 slot/内容
             */
            current_slot?: string | null;
            /**
             * Turn Count
             * @description 轮次计数
             */
            turn_count: number;
            /**
             * Updated At
             * Format: date-time
             * @description 更新时间
             */
            updated_at: string;
        };
        /**
         * Commitment
         * @description 承诺（确定性状态机，绝不 RAG）。
         */
        Commitment: {
            /**
             * Id
             * @description 承诺 ID
             */
            id: string;
            /**
             * Text
             * @description 承诺内容
             */
            text: string;
            /**
             * Created At
             * Format: date-time
             * @description 创建时间
             */
            created_at: string;
            /**
             * Status
             * @description 承诺状态
             * @enum {string}
             */
            status: "active" | "fulfilled" | "expired";
        };
        /**
         * ControlReq
         * @description R12：课堂控制指令（A9 新增 client_cmd_id 去重）。
         */
        ControlReq: {
            /**
             * Action
             * @description 控制动作
             * @enum {string}
             */
            action: "pause" | "resume" | "next_student" | "switch_content";
            /**
             * Payload
             * @description 动作附加数据
             */
            payload?: {
                [key: string]: unknown;
            } | null;
            /**
             * Client Cmd Id
             * @description 客户端命令 ID，用于去重
             */
            client_cmd_id: string;
        };
        /**
         * EnterReq
         * @description R2：进入教室请求。
         */
        EnterReq: {
            /**
             * Class Code
             * @description 班级码
             */
            class_code: string;
            /**
             * Student Name
             * @description 学生姓名，精确匹配
             */
            student_name: string;
        };
        /**
         * EnterResp
         * @description R2：进入教室响应。
         */
        EnterResp: {
            /**
             * Session Token
             * @description opaque session token，12h 有效
             * @example st_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
             */
            session_token: string;
            /** @description 学生 light profile */
            profile: components["schemas"]["StudentProfile"];
            /**
             * Expires At
             * Format: date-time
             * @description token 过期时间，ISO 8601 带时区
             */
            expires_at: string;
        };
        /**
         * GrowthView
         * @description R3：成长档案视图（任何视角不含 scores）。
         */
        GrowthView: {
            /**
             * Ideal
             * @description 理想职业/志向
             */
            ideal: string | null;
            /**
             * Commitments
             * @description 承诺列表
             */
            commitments: components["schemas"]["Commitment"][];
            /**
             * Last Gist
             * @description 上次一句话摘要
             */
            last_gist: string | null;
            /**
             * Growth Value
             * @description 成长值
             */
            growth_value: number;
            /**
             * Stage
             * @description 阶段字符串
             */
            stage: string;
            /** @description 宠物状态 */
            pet: components["schemas"]["PetState"];
            /**
             * Actions
             * @description view=full 追加：行动记录
             */
            actions?: {
                [key: string]: unknown;
            }[] | null;
            /**
             * History
             * @description view=full 追加：谈心记录
             */
            history?: {
                [key: string]: unknown;
            }[] | null;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** HealthCheck */
        HealthCheck: {
            /**
             * Status
             * @default ok
             */
            status: string;
        };
        /**
         * JobError
         * @description 任务失败时的错误信息。
         */
        JobError: {
            /**
             * Code
             * @description 错误码
             */
            code: string;
            /**
             * Message
             * @description 错误信息
             */
            message: string;
        };
        /**
         * JobRef
         * @description R5/R8：异步任务引用。
         */
        JobRef: {
            /**
             * Job Id
             * @description 任务 ID
             */
            job_id: string;
        };
        /**
         * JobStatus
         * @description R6：异步任务状态。
         */
        JobStatus: {
            /**
             * Job Id
             * @description 任务 ID
             */
            job_id: string;
            /**
             * Status
             * @description 任务状态
             * @enum {string}
             */
            status: "pending" | "running" | "done" | "failed";
            /**
             * Result Url
             * @description 产物 URL，done 时返回
             */
            result_url?: string | null;
            /** @description 失败时返回 */
            error?: components["schemas"]["JobError"] | null;
        };
        /**
         * LessonGenReq
         * @description R9：备课生成请求。
         */
        LessonGenReq: {
            /**
             * Topic
             * @description 课程主题
             */
            topic: string;
            /**
             * Goals
             * @description 教学目标
             */
            goals: string[];
            /**
             * Guidance
             * @description 引导策略
             */
            guidance?: string | null;
        };
        /**
         * LessonMaterial
         * @description 备课素材。
         */
        LessonMaterial: {
            /**
             * Title
             * @description 素材标题
             */
            title: string;
            /**
             * Content
             * @description 素材内容
             */
            content: string;
        };
        /**
         * LessonPlan
         * @description R9/R10：备课方案。
         */
        LessonPlan: {
            /**
             * Lesson Id
             * @description 课程 ID
             */
            lesson_id: string;
            /**
             * Topic
             * @description 课程主题
             */
            topic: string;
            /**
             * Goals
             * @description 教学目标
             */
            goals: string[];
            /**
             * Guidance Strategy
             * @description 引导策略
             */
            guidance_strategy: string;
            /**
             * Materials
             * @description 素材列表
             */
            materials: components["schemas"]["LessonMaterial"][];
            /**
             * Created At
             * Format: date-time
             * @description 创建时间
             */
            created_at: string;
        };
        /**
         * LessonSummary
         * @description R16：课程列表摘要（A4 新增）。
         */
        LessonSummary: {
            /**
             * Lesson Id
             * @description 课程 ID
             */
            lesson_id: string;
            /**
             * Topic
             * @description 课程主题
             */
            topic: string;
            /**
             * Date
             * @description 日期 MM-DD
             */
            date: string;
            /**
             * Duration
             * @description 时长
             */
            duration?: string | null;
            /**
             * Joined
             * @description 参与人数
             */
            joined: number;
            /**
             * Avg Score
             * @description 平均分，演示期可空
             */
            avg_score?: number | null;
            /**
             * Status
             * @description 课程状态
             * @enum {string}
             */
            status: "active" | "done";
            /**
             * Goal
             * @description 教学目标
             */
            goal: string;
            /**
             * Traces
             * @description 课堂痕迹
             */
            traces: string[];
        };
        /**
         * Letter
         * @description R7：学生来信（A6 新增 is_read）。
         */
        Letter: {
            /**
             * Letter Id
             * @description 信件 ID
             */
            letter_id: string;
            /**
             * Student Id
             * @description 学生 ID
             */
            student_id: string;
            /**
             * Title
             * @description 信件标题
             */
            title: string;
            /**
             * Body
             * @description 信件正文
             */
            body: string;
            /**
             * Generated At
             * Format: date-time
             * @description 生成时间
             */
            generated_at: string;
            /**
             * Source
             * @description 生成来源
             * @enum {string}
             */
            source: "template" | "llm";
            /**
             * Is Read
             * @description 是否已读
             */
            is_read: boolean;
        };
        /**
         * PetState
         * @description 宠物状态（v2.1 三态，A1）。
         */
        PetState: {
            /**
             * Species
             * @description 职业方向决定的外观族系
             */
            species: string;
            /**
             * Stage
             * @description 阶段 0..N
             */
            stage: number;
            /**
             * State
             * @description 三态：日常/关注/鼓舞
             * @enum {string}
             */
            state: "daily" | "gray" | "cheer";
            /**
             * Growth Value
             * @description 成长值
             */
            growth_value: number;
            /**
             * Last Growth At
             * Format: date-time
             * @description 上次成长时间
             */
            last_growth_at: string;
            /**
             * Cheer Until
             * @description 鼓舞态有效期截止
             */
            cheer_until?: string | null;
            /**
             * Needs Care
             * @description 是否需要教师关注（gray 态置位）
             */
            needs_care: boolean;
            /**
             * Portrait Url
             * @description 宠物画像 URL
             */
            portrait_url?: string | null;
            /**
             * Updated At
             * Format: date-time
             * @description 更新时间
             */
            updated_at: string;
        };
        /**
         * StudentProfile
         * @description 学生 profile（light 视图，A2 新增 role/grade/region/ideal）。
         */
        StudentProfile: {
            /**
             * Id
             * @description 学生唯一标识
             */
            id: string;
            /**
             * Name
             * @description 学生姓名
             */
            name: string;
            /**
             * Student No
             * @description 学号
             */
            student_no: string;
            /**
             * Class Code
             * @description 班级码
             */
            class_code: string;
            /**
             * Avatar Seed
             * @description 像素头像种子
             */
            avatar_seed: number;
            /**
             * Role
             * @description 校内角色
             * @enum {string}
             */
            role: "member" | "group_leader" | "class_committee" | "subject_rep";
            /**
             * Grade
             * @description 年级
             */
            grade: string;
            /**
             * Region Key
             * @description 地区 key
             */
            region_key: string;
            /**
             * Region Name
             * @description 地区名称
             */
            region_name: string;
            /**
             * Ideal
             * @description 理想
             */
            ideal?: string | null;
        };
        /**
         * SubjectScore
         * @description 单科成绩（含趋势）。
         */
        SubjectScore: {
            /**
             * Subject
             * @description 科目
             */
            subject: string;
            /**
             * Score
             * @description 分数 0-100
             */
            score: number;
            /**
             * Trend
             * @description 趋势
             * @enum {string}
             */
            trend: "up" | "down" | "flat";
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
            /** Input */
            input?: unknown;
            /** Context */
            ctx?: Record<string, never>;
        };
        /**
         * ErrorEnvelope
         * @description 统一错误 envelope（v2.1 契约 §2）。
         */
        ErrorEnvelope: {
            /**
             * Code
             * @description 面向程序的错误码
             * @example STUDENT_NOT_FOUND
             */
            code: string;
            /**
             * Message
             * @description 面向用户的可读信息
             * @example 该班级名单中没有这个名字
             */
            message: string;
            /**
             * Details
             * @description 扩展字段
             * @default null
             * @example {
             *       "candidates": [
             *         "王小雅",
             *         "吴小雪"
             *       ]
             *     }
             */
            details: {
                [key: string]: unknown;
            } | null;
        };
        /**
         * EvidenceItem
         * @description 评分证据链（可申诉）。
         */
        EvidenceItem: {
            /**
             * Rubric Id
             * @description 维度 ID
             */
            rubric_id: string;
            /**
             * Quote Span
             * @description 原文 span [start, end]
             */
            quote_span: [
                number,
                number
            ];
            /**
             * Source
             * @description 证据来源
             * @enum {string}
             */
            source: "transcript" | "profile";
            /**
             * Note
             * @description 备注
             */
            note: string;
        };
        /**
         * ScoreCard
         * @description 结算链产物；不进 R3/R17。
         */
        ScoreCard: {
            /**
             * Session Id
             * @description 会话 ID
             */
            session_id: string;
            /**
             * Student Id
             * @description 学生 ID
             */
            student_id: string;
            /**
             * Dimensions
             * @description rubric 各维度分
             */
            dimensions: {
                [key: string]: number;
            };
            /**
             * Total
             * @description 总分
             */
            total: number;
            /**
             * Evidence
             * @description 证据链
             */
            evidence: components["schemas"]["EvidenceItem"][];
            /**
             * Created At
             * Format: date-time
             * @description 创建时间
             */
            created_at: string;
            $defs: {
                /**
                 * EvidenceItem
                 * @description 评分证据链（可申诉）。
                 */
                EvidenceItem: {
                    /**
                     * Rubric Id
                     * @description 维度 ID
                     */
                    rubric_id: string;
                    /**
                     * Quote Span
                     * @description 原文 span [start, end]
                     */
                    quote_span: [
                        number,
                        number
                    ];
                    /**
                     * Source
                     * @description 证据来源
                     * @enum {string}
                     */
                    source: "transcript" | "profile";
                    /**
                     * Note
                     * @description 备注
                     */
                    note: string;
                };
            };
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    health_api_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthCheck"];
                };
            };
        };
    };
    get_class_api_classes__class_code__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                class_code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClassInfo"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_class_lessons_api_classes__class_code__lessons_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                class_code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LessonSummary"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_class_pets_api_classes__class_code__pets_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                class_code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClassPetView"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_class_academic_api_classes__class_code__academic_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                class_code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AcademicSummary"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    import_class_academic_api_classes__class_code__academic_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                class_code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    enter_api_session_enter_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EnterReq"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnterResp"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_growth_api_students__student_id__growth_get: {
        parameters: {
            query?: {
                view?: string;
            };
            header?: never;
            path: {
                student_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GrowthView"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_pet_api_students__student_id__pet_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                student_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PetState"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_portrait_api_students__student_id__pet_portrait_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                student_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JobRef"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_job_status_api_jobs__job_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                job_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JobStatus"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_letters_api_students__student_id__letters_get: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path: {
                student_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Letter"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    generate_letters_api_students__student_id__letters_generate_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                student_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JobRef"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    generate_lesson_api_lesson_generate_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LessonGenReq"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LessonPlan"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_lesson_api_lessons__lesson_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                lesson_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LessonPlan"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    start_session_api_classes__class_code__session_start_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                class_code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClassroomStatus"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    control_session_api_classes__class_code__session_control_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                class_code: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ControlReq"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClassroomStatus"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_session_status_api_classes__class_code__session_status_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                class_code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClassroomStatus"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
