import { UnstructuredClient } from "unstructured-client";
import { Strategy } from "unstructured-client/sdk/models/shared";
import { readFile } from "fs/promises";
import path from "path";
import { PartitionResponse } from "unstructured-client/sdk/models/operations";

const uploadDir = path.join(process.cwd(), "app", "data", "uploads");

export async function processWithUnstructured(
  // performs partitioning and chunking within one call
  fileId: string,
  originalName: string,
  mimeType: string
): Promise<unknown[]> {
  const apiKey = process.env.UNSTRUCTURED_API_KEY;
  if (!apiKey) {
    throw new Error("UNSTRUCTURED_API_KEY is not set");
  }

  const filePath = path.join(uploadDir, fileId);
  const content = await readFile(filePath);

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
      chunkingStrategy: "basic"
    },
  });

  if (Array.isArray(res)) {
    return res;
  }
  return [];
}
