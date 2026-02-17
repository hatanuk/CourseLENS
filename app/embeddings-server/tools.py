from contextvars import ContextVar
from langchain.tools import tool
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
from setup import client, embedding_model, chat_model
from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny
import os
import json

course_id_var: ContextVar[str | None] = ContextVar("course_id", default=None)
topics_var: ContextVar[list[dict] | None] = ContextVar("topics", default=None)


@tool
def summarize_topics() -> str:
    """List all topics in the current course along with their summaries. Use when the user asks about course topics, what the course covers, or wants an overview of the material."""
    topics = topics_var.get()
    if not topics:
        return "No course context. Topics are only available when chatting within a course."
    lines = []
    for t in topics:
        topic = t.get("topic", "Unknown")
        summary = t.get("summary", "")
        lines.append(f"**{topic}**\n{summary}")
    return "\n\n".join(lines) if lines else "No topics found for this course."

QUESTION_TYPES = ["multiple_choice", "true_false"]

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


@tool(response_format="content_and_artifact")
def generate_question(
    question_type: str,
    topic: str = "",
    count: int = 5,
) -> tuple[str, dict]:
    """Generate practice questions. question_type must be one of: multiple_choice, true_false. count is 1-5. Always retrieves relevant material from the course to base questions on."""
    count = max(1, min(5, count))
    if question_type not in QUESTION_TYPES:
        question_type = "multiple_choice"

    result = retrieve_context.invoke({"query": topic or "main concepts and key ideas"})
    context = result[0] if isinstance(result, (tuple, list)) and len(result) > 0 else str(result or "")

    sys_prompt = (
        "You generate practice questions. Return ONLY valid JSON, no other text. "
        f"Format: {{\"question_type\": \"{question_type}\", \"topic\": \"...\", \"questions\": [...]}}. "
    )
    if question_type == "multiple_choice":
        sys_prompt += "Each question: {\"text\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correct\": 0} (correct is 0-based index)."
    else:
        sys_prompt += "Each question: {\"text\": \"...\", \"correct\": true|false}."
    sys_prompt += f" Generate exactly {count} questions."

    user_content = f"Topic: {topic or 'general course material'}\n\n"
    if context:
        user_content += f"Context from the material:\n{context}\n\n"
    user_content += f"Generate {count} {question_type} questions."

    msgs = [SystemMessage(content=sys_prompt), HumanMessage(content=user_content)]
    response = chat_model.invoke(msgs)
    text = response.content if hasattr(response, "content") else str(response)

    try:
        cleaned = text.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)
        return cleaned, parsed
    except json.JSONDecodeError:
        return text, {"question_type": question_type, "topic": topic, "questions": [], "raw": text}


def get_context_from_clusters(course_id: str, cluster_ids: list[str]) -> str:
    """Fetch chunk text from Qdrant for given clusters. Returns serialized context."""
    if not course_id or not cluster_ids:
        return ""
    must = [
        FieldCondition(key="course_id", match=MatchValue(value=course_id)),
        FieldCondition(key="cluster_id", match=MatchAny(any=cluster_ids)),
    ]
    neighbors, _ = client.scroll(
        collection_name=os.environ["QDRANT_COLLECTION"],
        scroll_filter=Filter(must=must),
        limit=500,
        with_payload=True,
    )
    by_doc = {}
    for r in neighbors:
        payload = r.payload or {}
        doc_id = payload.get("document_id")
        text = payload.get("text", "")
        if doc_id:
            by_doc.setdefault(doc_id, []).append(text.replace("\n", " ").strip())
    lines = []
    for doc_id, texts in by_doc.items():
        lines.append(f"--- {doc_id} ---")
        for t in texts[:20]:
            if t:
                lines.append(t)
    return "\n\n".join(lines) if lines else ""


def generate_question_set(
    course_id: str,
    cluster_ids: list[str] | None,
    question_types: list[str],
    count: int = 5,
) -> list[dict]:
    """Generate question sets. If cluster_ids provided, use only those clusters for context."""
    count = max(1, min(10, count))
    question_types = [t for t in question_types if t in QUESTION_TYPES] or ["multiple_choice"]
    results = []

    if cluster_ids and len(cluster_ids) > 0:
        context = get_context_from_clusters(course_id, cluster_ids)
    else:
        course_id_var.set(course_id)
        result = retrieve_context.invoke({"query": "main concepts and key ideas"})
        context = result[0] if isinstance(result, (tuple, list)) and len(result) > 0 else str(result or "")

    for qtype in question_types:
        sys_prompt = (
            "You generate practice questions. Return ONLY valid JSON, no other text. "
            f'Format: {{"question_type": "{qtype}", "topic": "...", "questions": [...]}}. '
        )
        if qtype == "multiple_choice":
            sys_prompt += 'Each question: {"text": "...", "options": ["A", "B", "C", "D"], "correct": 0} (correct is 0-based index).'
        else:
            sys_prompt += 'Each question: {"text": "...", "correct": true|false}.'
        sys_prompt += f" Generate exactly {count} questions."

        user_content = "Context from the material:\n" + (context or "No specific context.") + f"\n\nGenerate {count} {qtype} questions."
        msgs = [SystemMessage(content=sys_prompt), HumanMessage(content=user_content)]
        response = chat_model.invoke(msgs)
        text = str(response.content) if hasattr(response, "content") else str(response)

        try:
            cleaned = text.strip().replace("```json", "").replace("```", "").strip()
            parsed = json.loads(cleaned)
            results.append(parsed)
        except json.JSONDecodeError:
            results.append({"question_type": qtype, "topic": "", "questions": [], "raw": text})

    return results


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
