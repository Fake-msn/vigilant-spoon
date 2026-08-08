-- RAG 知识库：知识文档表 + 分块向量表
-- 按「RAG 铁律」仅用于开场素材 / 备课 / 评语，不参与对话轮次。

CREATE TABLE IF NOT EXISTS knowledge_docs (
    doc_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_category ON knowledge_docs(category);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    chunk_id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id TEXT NOT NULL REFERENCES knowledge_docs(doc_id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT,
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc ON knowledge_chunks(doc_id);