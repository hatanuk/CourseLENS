'use client';

import { useState } from 'react';
import type { FileMetadata } from '@/app/data/structures';
import FileUploadContent from './FileUploadContent';
import OptionsContent from './OptionsContent';

interface UploadPageWrapperProps {
  files: FileMetadata[];
  uploadId: string;
}

export default function UploadPageWrapper({ files, uploadId }: UploadPageWrapperProps) {
  const [allProcessed, setAllProcessed] = useState(false);

  return (
    <>
      <FileUploadContent
        files={files}
        uploadId={uploadId}
        allProcessed={allProcessed}
        setAllProcessed={setAllProcessed}
      />
      <OptionsContent files={files} allProcessed={allProcessed} />
    </>
  );
}
