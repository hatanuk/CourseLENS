from langchain_core.messages import AIMessage, ToolMessage
from pydantic import BaseModel
from typing import Any, List
import hdbscan
import umap
import numpy as np
import os
from setup import app, chat_model, agent, vector_store, embedding_model
from tools import course_id_var, topics_var, generate_question_set

MIN_CLUSTER_SIZE = 5
MAX_CLUSTER_SIZE = 300

class EmbedRequest(BaseModel):
    chunks: List[str]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    content: str
    messages: list[ChatMessage] = []
    course_id: str | None = None


class GenerateQuestionSetRequest(BaseModel):
    course_id: str
    cluster_ids: list[str] | None = None
    question_types: list[str] = ["multiple_choice"]
    count: int = 5


@app.post("/chat")
def chat(request: ChatRequest):
    content = request.content
    course_id_var.set(request.course_id)
    topics_var.set(request.topics)
    tool_calls_log = []
    pending_calls = {}
    response = None

    # Build message history: prior context (max 100) + new user message
    history = [{"role": m.role, "content": m.content} for m in request.messages[-100:]]
    history.append({"role": "user", "content": content})

    for step in agent.stream({"messages": history}, stream_mode="values"):
        last = step["messages"][-1]

        # collect tool usage
        if hasattr(last, "tool_calls") and last.tool_calls:
            for call in last.tool_calls:
                pending_calls[call["id"]] = {
                    "tool_name": call["name"],
                    "args": call["args"],
                    "result": None
                }

        if isinstance(last, ToolMessage):
            call_id = last.tool_call_id
            if call_id in pending_calls:
                entry = pending_calls.pop(call_id)
                entry["result"] = last.content
                if hasattr(last, "artifact") and last.artifact is not None:
                    entry["artifact"] = last.artifact
                tool_calls_log.append(entry)

        if isinstance(last, AIMessage) and not last.tool_calls:
            response = last.content

    return {
        "response": response,
        "tool_log": tool_calls_log
    }


@app.post("/generate-question-set")
def generate_question_set_endpoint(request: GenerateQuestionSetRequest):
    result = generate_question_set(
        course_id=request.course_id,
        cluster_ids=request.cluster_ids,
        question_types=request.question_types,
        count=request.count,
    )
    return {"question_sets": result}
    

@app.post("/embed")
def embed(request: EmbedRequest):

    # Embedding
    vectors = embedding_model.embed_documents(
        request.chunks
    )
    vectors = np.array(vectors)

    # Reduction: skip UMAP when too few points (UMAP needs n_neighbors < n_samples)
    min_for_umap = 15
    if len(vectors) <= min_for_umap:
        reduced = vectors
    else:
        n_neighbors = min(15, len(vectors) - 1)
        n_components = min(5, len(vectors) - 1)
        reducer = umap.UMAP(
            n_components=n_components,
            n_neighbors=n_neighbors,
            min_dist=0.05,
            metric="cosine",
            random_state=42,
        )
        reduced = reducer.fit_transform(vectors)

    # Clustering
    clusters = cluster_recursive(reduced, list(range(len(vectors))))


    return {
        "embeddings": vectors.tolist(),
        "clusters": clusters,
    }

def cluster_recursive(reduced_vectors, indices, level=0):
    """
    vectors: full embedding matrix
    indices: subset indices to cluster
    level: recursion depth
    """
    subset = reduced_vectors[indices]
    n = len(subset)

    if n < 2:
        return []

    min_cluster_size = min(MIN_CLUSTER_SIZE, max(2, n // 2))
    min_samples = min(min_cluster_size, n - 1)

    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=min_cluster_size,
        min_samples=min_samples,
    )

    labels = clusterer.fit_predict(subset)

    clusters = {}
    for i, label in enumerate(labels):
        clusters.setdefault(label, []).append(indices[i])

    final_clusters = []

    for label, member_indices in clusters.items():
        if label == -1:
            continue 
        if len(member_indices) > MAX_CLUSTER_SIZE:
            # Re-cluster oversized cluster
            print(f"Splitting cluster at level {level}, size={len(member_indices)}")
            subclusters = cluster_recursive(
                reduced_vectors,
                member_indices,
                level=level + 1
            )
            final_clusters.extend(subclusters)
        else:
            final_clusters.append(sorted(member_indices))

    return final_clusters
