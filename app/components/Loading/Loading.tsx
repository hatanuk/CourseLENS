import styles from "./Loading.module.css";

export default function Loading() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.spinner} />
        <span className={styles.label}>Working on it...</span>
      </div>
    </div>
  );
}
