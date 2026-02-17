import OpenAI from "openai";
import { z } from "zod";

const MAX_SUMMARY = 400

const TopicResponseSchema = z.object({
  topic: z.string().min(1).max(100).transform((s) => s.trim()),
  summary: z.string().transform((s) => s.trim().slice(0, MAX_SUMMARY)),
})

type TopicResponse = z.infer<typeof TopicResponseSchema>

export type ClusterMeta = { topic: string; summary: string }

const MAX_RETRIES = 3

async function labelOneCluster(
  clusterChunks: string,
  client: OpenAI
): Promise<ClusterMeta | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a topic naming and summarizing assistant. 
          Given a set of text chunks from a document cluster, assign a short, 
          descriptive topic name (2-6 words) that captures the main theme, 
          and write a brief summary of the main ideas in 3-5 sentences (max ${MAX_SUMMARY} chars). 
          Respond with a JSON object: {"topic": "your topic name", "summary": "your summary"}`,
          },
          {
            role: "user",
            content: `<document_chunks>\n\n${clusterChunks}\n\n</document_chunks>`,
          },
        ],
        response_format: { type: "json_object" },
      })

      const raw = completion.choices[0]?.message?.content ?? "{}"
      const parsed = JSON.parse(raw) as unknown
      const result = TopicResponseSchema.parse(parsed) as ClusterMeta
      return result
    } catch {
      if (attempt === MAX_RETRIES - 1) return null
    }
  }
  return null
}

export async function labelClusters(
  chunks: string[],
  clusters: number[][],
  openaiApiKey: string
): Promise<{ clusters: number[][]; meta: (ClusterMeta | null)[] }> {
  if (chunks.length === 0 || clusters.length === 0) {
    return { clusters: [], meta: [] }
  }

  const client = new OpenAI({ apiKey: openaiApiKey })

  const meta = await Promise.all(
    clusters.map(async (memberIndices) => {
      const clusterChunks = memberIndices
        .map((i) => chunks[i])
        .filter(Boolean)
        .join("\n\n---\n\n")
      return labelOneCluster(clusterChunks, client)
    })
  )

  return { clusters, meta }
}
