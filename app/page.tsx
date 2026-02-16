import UploadPanel from './components/UploadPanel';
import TopBar from './components/TopBar';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <>
      <TopBar />
      <div className={styles.homePage}>
        <h1 className={styles.pageTitle}>upload study material</h1>
        <UploadPanel />
      </div>
    </>
  );
}
