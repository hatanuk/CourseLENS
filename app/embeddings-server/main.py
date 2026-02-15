from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import Any, List
import hdbscan
import umap
import numpy as np

MIN_CLUSTER_SIZE = 5
MAX_CLUSTER_SIZE = 300

app = FastAPI()

model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")


class EmbedRequest(BaseModel):
    chunks: List[str]


@app.post("/embed")
def embed(request: EmbedRequest):

    # Embedding
    embeddings = model.encode(
        request.chunks,
        normalize_embeddings=True,
    )
    embeddings = np.array(embeddings)

    # Reduction: skip UMAP when too few points (UMAP needs n_neighbors < n_samples)
    min_for_umap = 15
    if len(embeddings) <= min_for_umap:
        reduced = embeddings
    else:
        n_neighbors = min(15, len(embeddings) - 1)
        n_components = min(5, len(embeddings) - 1)
        reducer = umap.UMAP(
            n_components=n_components,
            n_neighbors=n_neighbors,
            min_dist=0.05,
            metric="cosine",
            random_state=42,
        )
        reduced = reducer.fit_transform(embeddings)

    # Clustering
    clusters = cluster_recursive(reduced, list(range(len(embeddings))))


    return {
        "embeddings": embeddings.tolist(),
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
