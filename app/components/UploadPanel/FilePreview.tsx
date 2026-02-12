

import {
    FileText,
    FileSpreadsheet,
    FileImage,
    FileArchive,
    FileCode,
    FileVideo,
    FileAudio,
    Presentation,
    File,
    X,
} from 'lucide-react';

import type { ReactElement } from "react";

import styles from './UploadPanel.module.css';

const FILE_TYPE_COLORS: Record<string, string> = {
    pdf: '#e37717',
    txt: '#64748b',
    doc: '#2961d9',
    docx: '#2961d9',
    ppt: '#e34d3d',
    pptx: '#e34d3d',
    md: '#64748b',
};

function getFileTypeString(fileType: string) {
    const t = fileType.toLowerCase();

    if (t.includes('spreadsheetml')) return 'xlsx';
    if (t.includes('wordprocessingml')) return 'docx';
    if (t.includes('presentationml')) return 'pptx';

    if (t.includes('/')) {
        return t.split('/')[1]
      }

    return t
}

export function getColorForFile(fileType: string): string {
    const type = getFileTypeString(fileType);
    return FILE_TYPE_COLORS[type] ?? '#64748b';
}


export function getIcon(fileType: string, size: number): ReactElement {
    const type = fileType.includes('/') ? getFileTypeString(fileType) : fileType;

    switch (type) {
        case 'xls':
        case 'xlsx':
        case 'csv':
            return <FileSpreadsheet size={size} />;

        case 'ppt':
        case 'pptx':
            return <Presentation size={size} />;

        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'bmp':
        case 'webp':
            return <FileImage size={size} />;

        case 'zip':
        case 'rar':
        case '7z':
        case 'tar':
        case 'gz':
            return <FileArchive size={size} />;

        case 'js':
        case 'ts':
        case 'tsx':
        case 'css':
        case 'html':
        case 'json':
        case 'py':
        case 'java':
        case 'cpp':
        case 'c':
        case 'cs':
        case 'rb':
        case 'php':
        case 'go':
        case 'rs':
        case 'sh':
            return <FileCode size={size} />;

        case 'mp4':
        case 'mov':
        case 'wmv':
        case 'avi':
        case 'webm':
        case 'mkv':
            return <FileVideo size={size} />;

        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'flac':
            return <FileAudio size={size} />;

        case 'pdf':
            return <File size={size} />;

        case 'txt':
        case 'doc':
        case 'docx':
            return <FileText size={size} />;

        default:
            return <FileText size={size} />;
    }
}

interface FilePreviewProps {
    file: File;
    onRemove?: () => void;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {

    const fileTypeString = getFileTypeString(file.type).toUpperCase() ?? "UNK"

    const iconColor = getColorForFile(file.type);

    function FileIcon({ file, size }: { file: File; size: number }) {
        return getIcon(file.type, size)
    }

    function handleRemove(e: React.MouseEvent) {
        e.stopPropagation();
        onRemove?.();
    }

    return <div className={styles.filePreview}>
        {onRemove && (
            <button
                type="button"
                className={styles.removeBtn}
                onClick={handleRemove}
                aria-label="Remove file"
            >
                <X size={20} />
            </button>
        )}
        <span style={{ color: iconColor }}><FileIcon file={file} size={36} /></span>
        <span className={styles.fileType}>{fileTypeString}</span>
        <span className={styles.fileLabel}>
            {file.name}
        </span>
    </div>
}
