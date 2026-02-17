from contextvars import ContextVar
from langchain.tools import tool
from langchain_core.documents import Document
from setup import client, embedding_model
from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny
import os

course_id_var: ContextVar[str | None] = ContextVar("course_id", default=None)

@tool(response_format="content_and_artifact")
def retrieve_context(query: str):
    """Retrieve information to help answer a query."""
    query_vector = embedding_model.embed_query(query)
    course_id = course_id_var.get()
    q_filter = Filter(must=[FieldCondition(key="course_id", match=MatchValue(value=course_id))]) if course_id else None
    response = client.query_points(
        collection_name=os.environ["QDRANT_COLLECTION"],
        query=query_vector,
        limit=3,
        with_payload=True,
        query_filter=q_filter,
    )
    points = response.points

    sections = []
    docs = []
    for i, point in enumerate(points):
        payload = point.payload or {}
        doc_id = payload.get("document_id")
        chunk_idx = payload.get("chunk_index")
        header = doc_id or "Unknown"
        if doc_id is not None and chunk_idx is not None:
            results = get_neighbor_chunks(doc_id, chunk_idx, course_id=course_id)
            results.sort(key=lambda r: r.payload.get("chunk_index", 0) if r.payload else 0)
            lines = []
            for r in results:
                if r.payload and "text" in r.payload:
                    cidx = r.payload.get("chunk_index", "?")
                    text = r.payload["text"].replace("\n", " ").strip()
                    lines.append(f"[Chunk {cidx}] {text}")
            sections.append(f"--- {header} |{chunk_idx} ---\n" + "\n".join(lines))
            docs.append(Document(page_content=payload.get("text", ""), metadata={"document_id": doc_id, "chunk_index": chunk_idx}))
        else:
            text = payload.get("text", "")
            sections.append(f"--- {header} ---\n{text}")
            docs.append(Document(page_content=text, metadata={}))

    serialized = "\n\n".join(sections)
    return serialized, docs


#@tool(response_format="content_and_artifact")
#ef generate_question_set()


def get_neighbor_chunks(doc_id, chunk_index, prev_x=5, next_x=5, course_id=None):

    prev_x = max(0, prev_x)
    next_x = max(0, next_x)

    target_chunks = list(range(chunk_index - prev_x, chunk_index + next_x + 1))

    must = [
        FieldCondition(key="document_id", match=MatchValue(value=doc_id)),
        FieldCondition(key="chunk_index", match=MatchAny(any=target_chunks)),
    ]
    if course_id:
        must.append(FieldCondition(key="course_id", match=MatchValue(value=course_id)))

    neighbors, _ = client.scroll(
        collection_name=os.environ["QDRANT_COLLECTION"],
        scroll_filter=Filter(must=must),
        limit=100,
    )
    return neighbors
