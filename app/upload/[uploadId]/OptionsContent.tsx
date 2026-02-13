'use client';

import { useState } from 'react';
import type { FileMetadata } from "@/app/data/structures";
import styles from "./UploadPage.module.css";

type OptionsContentProps = {
    files: FileMetadata[];
    allProcessed: boolean;
}

export default function OptionsContent({ files, allProcessed }: OptionsContentProps) {
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
        () => new Set(files.map((f) => f.id))
    );

    const [questionTypes, setQuestionTypes] = useState({ mcq: true, freeResponse: true, tf: true });
    const [questionCount, setQuestionCount] = useState<'low' | 'med' | 'high'>('low');

    const hasSelection = selectedFileIds.size > 0;


    const toggleFile = (id: string) => {
        setSelectedFileIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleQuestionType = (key: keyof typeof questionTypes) => {
        setQuestionTypes((prev) => ({ ...prev, [key]: !prev[key] }));
    };



    return (
        <>
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Question options</h2>

                <div className={styles.optionGroup}>
                    <label className={styles.label}>Files to use</label>
                    <div className={styles.checkboxGroup}>
                        {files.map((file) => (
                            <label key={file.id} className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedFileIds.has(file.id)}
                                    onChange={() => toggleFile(file.id)}
                                />
                                <span>{file.originalName}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.optionGroup}>
                    <label className={styles.label}>Number of questions</label>
                    <div className={styles.segmented}>
                        {(['low', 'med', 'high'] as const).map((level) => (
                            <button
                                key={level}
                                type="button"
                                className={`${styles.segmentedBtn} ${questionCount === level ? styles.segmentedActive : ''}`}
                                onClick={() => setQuestionCount(level)}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.optionGroup}>
                    <label className={styles.label}>Question types</label>
                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={questionTypes.mcq}
                                onChange={() => toggleQuestionType('mcq')}
                            />
                            <span>Multiple choice</span>
                        </label>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={questionTypes.freeResponse}
                                onChange={() => toggleQuestionType('freeResponse')}
                            />
                            <span>Free response</span>
                        </label>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={questionTypes.tf}
                                onChange={() => toggleQuestionType('tf')}
                            />
                            <span>True / false</span>
                        </label>
                    </div>
                </div>
            </section>

            <button
                className={styles.generateBtn}
                disabled={!allProcessed || !hasSelection}
            >
                Generate questions
            </button>
        </>
    );
}

