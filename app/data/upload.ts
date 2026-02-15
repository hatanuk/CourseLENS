import { fileTypeFromBuffer, FileTypeResult } from "file-type"


export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/markdown',
] as const;

export function isAcceptedMimeType(mimeType: string): boolean {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isAcceptedFile(file: File): boolean {
  return isAcceptedMimeType(file.type);
}

const EXT_TO_MIME: Record<string, string> = {
  txt: "text/plain",
  md: "text/markdown",
}

export async function validateFileTypeFromBuffer(
  buffer: Uint8Array | ArrayBuffer,
  filename?: string
): Promise<FileTypeResult> {
  let fileType = await fileTypeFromBuffer(buffer)
  if (!fileType && filename) {
    const ext = filename.split(".").pop()?.toLowerCase()
    if (ext && EXT_TO_MIME[ext] && isAcceptedMimeType(EXT_TO_MIME[ext])) {
      fileType = { ext, mime: EXT_TO_MIME[ext] } as FileTypeResult
    }
  }
  if (!fileType || !isAcceptedMimeType(fileType.mime)) {
    throw Error("File type is not supported")
  }
  return fileType
}
