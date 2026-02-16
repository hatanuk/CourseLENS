import { UnstructuredClient } from "unstructured-client";
import { Strategy } from "unstructured-client/sdk/models/shared";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const uploadDir = path.join(process.cwd(), "app", "data", "uploads");
const figuresDir = path.join(process.cwd(), "app", "data", "figures");

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
      overlap: 50,
      maxCharacters: 500,
      newAfterNChars: 250,
      extractImageBlockTypes: ["Image"],
    },
  });

  if (Array.isArray(res)) {
    return res
  }
  return []
}

/** Extract images from elements, save to figures dir, return relative paths for serving */
export async function extractAndSaveImages(
  elements: unknown[],
  documentId: string
): Promise<string[]> {
  const dir = path.join(figuresDir, documentId);
  await mkdir(dir, { recursive: true });
  const saved: string[] = [];
  let idx = 0;
  for (const el of elements) {
    const e = el as { type?: string; metadata?: { image_base64?: string } };
    if (e?.type === "Image" && typeof e?.metadata?.image_base64 === "string") {
      const buf = Buffer.from(e.metadata.image_base64, "base64");
      const ext = buf[0] === 0x89 && buf[1] === 0x50 ? "png" : "jpg";
      const filename = `${idx}.${ext}`;
      const filepath = path.join(dir, filename);
      await writeFile(filepath, buf);
      saved.push(`${documentId}/${filename}`);
      idx++;
    }
  }
  return saved;
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
