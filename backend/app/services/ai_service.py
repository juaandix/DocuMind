from collections.abc import AsyncGenerator

from bson import ObjectId

from app.config import settings
from app.database import get_db


class AIService:
    def __init__(self):
        self._embedder = None
        self._llm = None

    def _get_embedder(self):
        if self._embedder is None:
            if settings.llm_provider == "anthropic":
                from langchain_community.embeddings import VoyageEmbeddings

                self._embedder = VoyageEmbeddings(
                    voyage_api_key=settings.anthropic_api_key, model="voyage-3"
                )
            else:
                from langchain_openai import OpenAIEmbeddings

                self._embedder = OpenAIEmbeddings(
                    api_key=settings.openai_api_key, model=settings.embedding_model
                )
        return self._embedder

    def _get_llm(self):
        if self._llm is None:
            if settings.llm_provider == "anthropic":
                from langchain_anthropic import ChatAnthropic

                self._llm = ChatAnthropic(
                    api_key=settings.anthropic_api_key,
                    model=settings.llm_model,
                    streaming=True,
                )
            else:
                from langchain_openai import ChatOpenAI

                self._llm = ChatOpenAI(
                    api_key=settings.openai_api_key,
                    model=settings.llm_model,
                    streaming=True,
                )
        return self._llm

    async def similarity_search(
        self,
        query: str,
        workspace_id: str,
        document_ids: list[str],
        top_k: int = 5,
    ) -> list[dict]:
        embedding = await self._get_embedder().aembed_query(query)
        db = get_db()

        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": embedding,
                    "numCandidates": 100,
                    "limit": top_k,
                    "filter": {
                        "workspace_id": ObjectId(workspace_id),
                        "document_id": {"$in": [ObjectId(d) for d in document_ids]},
                    },
                }
            },
            {"$addFields": {"score": {"$meta": "vectorSearchScore"}}},
        ]

        chunks = []
        async for chunk in db.document_chunks.aggregate(pipeline):
            chunks.append(
                {
                    "document_id": str(chunk["document_id"]),
                    "content": chunk["content"],
                    "metadata": chunk.get("metadata", {}),
                    "score": chunk.get("score", 0.0),
                }
            )
        return chunks

    async def stream_answer(
        self,
        question: str,
        context_chunks: list[dict],
        history: list[dict],
    ) -> AsyncGenerator[str, None]:
        from langchain.schema import AIMessage, HumanMessage, SystemMessage

        context = "\n\n---\n\n".join(
            f"[Source: {c['metadata'].get('source', 'unknown')}, "
            f"page {c['metadata'].get('page', 'N/A')}]\n{c['content']}"
            for c in context_chunks
        )

        messages = [
            SystemMessage(
                content=(
                    "You are an assistant that answers questions ONLY based on"
                    " the provided documents. "
                    "If the information is not in the documents, say so clearly. "
                    "Always cite which document and page your answer comes from.\n\n"
                    f"CONTEXT:\n{context}"
                )
            )
        ]

        for msg in history[-10:]:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

        messages.append(HumanMessage(content=question))

        llm = self._get_llm()
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield chunk.content


ai_service = AIService()
