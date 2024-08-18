"use client";
import React, { useState, useEffect } from 'react';
import { Image } from '@nextui-org/react';
import styles from './dashboard-left-bottom.module.css';
import { getSessions } from '../../../firebase';

const generateCombinedImageUrl = () => '/api/combined-image';

const Forest: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [combinedImageUrl, setCombinedImageUrl] = useState<string>('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionData = await getSessions();
        setSessions(sessionData || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
  
    fetchSessions();
  }, []); // This runs once on component mount
  
  // New useEffect to regenerate the combined image URL whenever sessions update
  useEffect(() => {
    if (sessions.length > 0) {
      const imageUrl = generateCombinedImageUrl();
      setCombinedImageUrl(imageUrl);
    }
  }, [sessions]); 

  return (
    <div className={styles.leftBottomFrame}>
      <Image
        isBlurred
        src={combinedImageUrl}
        alt="Combined Plant Land Plot"
        className={styles.currentPlant}
      />
    </div>
  );
};

export default Forest;
