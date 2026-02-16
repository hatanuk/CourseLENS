import Image from "next/image";
import styles from "./Loading.module.css";

interface LoadingProps {
  compact?: boolean;
  showLabel?: boolean;
}

export default function Loading({ compact, showLabel = true }: LoadingProps) {
  return (
    <div className={compact ? styles.wrapperCompact : styles.wrapper}>
      <div className={styles.container}>
        <Image src="/images/loading.gif" alt="" width={48} height={48} className={styles.gif} unoptimized />
        {showLabel && <span className={styles.label}>Working on it...</span>}
      </div>
    </div>
  );
}
