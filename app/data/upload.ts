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

export async function validateFileTypeFromBuffer(buffer: Uint8Array | ArrayBuffer): Promise<FileTypeResult> {
  const fileType = (await fileTypeFromBuffer(buffer))
  if (!fileType || !isAcceptedMimeType(fileType.mime)) {
    throw Error("File type is not supported")
  }
  return fileType
}
