import React from 'react';
import styles from './page.module.css';


const App: React.FC = () => {
  return (
    <div className={styles.container}>      
      <div className={styles.leftFrame}>
        <div className={styles.leftTopFrame}></div>
        <div className={styles.leftBottomFrame}></div>
      </div>

      <div className={styles.rightFrame}>
        <div className={styles.rightTopFrame}></div>
        <div className={styles.rightBottomFrame}></div>
      </div>
    </div>
  );
};

export default App;
