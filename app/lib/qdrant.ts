import { QdrantClient } from "@qdrant/js-client-rest"

const url = process.env.QDRANT_URL
const apiKey = process.env.QDRANT_API_KEY

export type QdrantPointPayload = {
  course_id: string;
  document_id: string;
  chunk_index: number;
  cluster_id: string;
  text: string;
}


export type QdrantPoint = {
  id: string
  vector: number[]
  payload: QdrantPointPayload
}

export const qdrant = url && apiKey
  ? new QdrantClient({ url, apiKey })
  : null;

const COLLECTION = process.env.QDRANT_COLLECTION ?? "chunks"
const VECTOR_SIZE = 768 // sentence-transformers/all-mpnet-base-v2

export async function ensureCollection(): Promise<void> {
  if (!qdrant) throw new Error("Qdrant not configured. Set QDRANT_URL and QDRANT_API_KEY in .env")
  const exists = await qdrant.collectionExists(COLLECTION)
  if (!exists.exists) {
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: VECTOR_SIZE, distance: "Cosine" },
    })
  }
  await ensurePayloadIndexes()
}

async function ensurePayloadIndexes(): Promise<void> {
  if (!qdrant) return
  const keywordFields = ["document_id", "course_id", "cluster_id"]
  for (const field of keywordFields) {
    try {
      await qdrant.createPayloadIndex(COLLECTION, {
        field_name: field,
        field_schema: "keyword",
        wait: true,
      })
    } catch {
      /* index may already exist */
    }
  }
  try {
    await qdrant.createPayloadIndex(COLLECTION, {
      field_name: "chunk_index",
      field_schema: "integer",
      wait: true,
    })
  } catch {
    /* index may already exist */
  }
}


export async function upsertPoints(points: QdrantPoint[]): Promise<void> {
  if (points.length === 0) return
  await ensureCollection()
  await qdrant!.upsert(COLLECTION, {
    wait: true,
    points: points.map((p) => ({ id: p.id, vector: p.vector, payload: p.payload })),
  })
}

export async function getChunksByClusterIds(
  courseId: string,
  clusterIds: string[]
): Promise<QdrantPointPayload[]> {
  if (!qdrant || clusterIds.length === 0) return []
  try {
    await ensureCollection()
  } catch {
    return []
  }
  const payloads: QdrantPointPayload[] = []
  let offset: string | number | undefined
  while (true) {
    const res = await qdrant.scroll(COLLECTION, {
      filter: {
        must: [
          { key: "course_id", match: { value: courseId } },
          { key: "cluster_id", match: { any: clusterIds } },
        ],
      },
      limit: 500,
      ...(offset !== undefined && { offset }),
      with_payload: true,
      with_vector: false,
    })
    for (const p of res.points) {
      if (p.payload) payloads.push(p.payload as QdrantPointPayload)
    }
    if (res.points.length < 500) break
    offset = res.points[res.points.length - 1].id
  }
  return payloads
}

export async function setPayloadByDocumentIds(documentIds: string[], payload: Partial<QdrantPointPayload>): Promise<void> {
  if (!qdrant || documentIds.length === 0) return
  await ensureCollection()
  const pointIds: string[] = []
  let offset: string | number | undefined
  while (true) {
    const res = await qdrant.scroll(COLLECTION, {
      filter: {
        must: [{ key: "document_id", match: { any: documentIds } }],
      },
      limit: 100,
      ...(offset !== undefined && { offset }),
      with_payload: false,
      with_vector: false,
    })
    pointIds.push(...res.points.map((p) => p.id as string))
    if (res.points.length < 100) break
    offset = res.points[res.points.length - 1].id
  }
  if (pointIds.length === 0) return
  await qdrant.setPayload(COLLECTION, { payload, points: pointIds })
}
