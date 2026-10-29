from app.workers.document_processor import _extract_text


def test_plain_text_is_split_into_overlapping_chunks_with_metadata():
    sentence = "Either party may terminate this Agreement with sixty days of written notice. "
    text = (sentence * 40).encode()

    chunks = _extract_text(text, "text/plain", "contract.txt")

    assert len(chunks) > 1
    assert all(len(c["content"]) <= 800 for c in chunks)
    assert chunks[0]["metadata"] == {"page": None, "chunk_index": 0, "source": "contract.txt"}


def test_rag_message_types_import():
    # Imported lazily in ai_service; LangChain 1.x moved them out of langchain.schema.
    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

    assert AIMessage and HumanMessage and SystemMessage
