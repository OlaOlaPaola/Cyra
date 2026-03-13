import styles from './LoadingScreen.module.css';

const LoadingScreen = () => {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <img src="/cyra-logo.png" alt="Plan4HER Logo" className={styles.logoImage} />
        </div>
        <h1 className={styles.title}>Ready to plan with your natural rhythm?</h1>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

