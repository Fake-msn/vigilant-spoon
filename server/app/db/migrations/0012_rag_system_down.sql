-- RAG 知识库回滚：丢弃向量表与文档表

DROP TABLE IF EXISTS knowledge_chunks;
DROP TABLE IF EXISTS knowledge_docs;