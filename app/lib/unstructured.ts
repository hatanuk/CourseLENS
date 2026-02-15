import { UnstructuredClient } from "unstructured-client";
import { Strategy } from "unstructured-client/sdk/models/shared";
import { readFile } from "fs/promises";
import path from "path";

const uploadDir = path.join(process.cwd(), "app", "data", "uploads");

export async function processWithUnstructured(
  // performs partitioning and chunking within one call
  fileId: string,
  originalName: string,
  mimeType: string
): Promise<unknown[]> {
  const apiKey = process.env.UNSTRUCTURED_API_KEY
  if (!apiKey) {
    throw new Error("UNSTRUCTURED_API_KEY is not set")
  }

  const filePath = path.join(uploadDir, fileId)
  const content = await readFile(filePath)

  const client = new UnstructuredClient({
    security: { apiKeyAuth: apiKey },
    serverURL: process.env.UNSTRUCTURED_API_URL ?? undefined,
  });

  const res = await client.general.partition({
    partitionParameters: {
      files: {
        content,
        fileName: originalName,
      },
      strategy: Strategy.Auto,
      contentType: mimeType,
      chunkingStrategy: "by_title",
      overlap: 150,
      maxCharacters: 1000,
      newAfterNChars: 800
    },
  });

  if (Array.isArray(res)) {
    return res
  }
  return []
}

/** Extract text chunks from Unstructured elements for embedding/clustering */
export function elementsToChunks(elements: unknown[]): string[] {
  return elements
    .map((el) => {
      const e = el as { text?: string; type?: string; metadata?: { text_as_html?: string } }
      if (typeof e?.text === "string" && e.text.length > 0) return e.text
      if (e?.type === "Table" && e?.metadata?.text_as_html) return e.metadata.text_as_html
      return null
    })
    .filter((t): t is string => typeof t === "string" && t.length > 0)
}
