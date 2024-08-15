"use client";
import React, { useState, useEffect } from 'react';
import { Image } from '@nextui-org/react';
import styles from './dashboard-left-bottom.module.css';
import { getSessions } from "../../../firebase";

const Forest: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [images, setImages] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionData = await getSessions();
        // Set sessions to an empty array if sessionData is undefined
        setSessions(sessionData || []);
  
        // Only process sessionData if it's defined
        if (sessionData) {
          const imageMap = new Map<number, string>();
          sessionData.forEach(session => {
            const { plantNumber, plantStage } = session;
            const imageUrl = `/plant_images/plant_${plantNumber}_stage_${plantStage}.png`;
  
            // Log each plant number and stage
            console.log(`Plant Number: ${plantNumber}, Plant Stage: ${plantStage}, Image URL: ${imageUrl}`);
            
            imageMap.set(plantNumber, imageUrl);
          });
  
          setImages(imageMap);
        } else {
          console.log('sessionData is undefined');
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
  
    fetchSessions();
  }, []);
  

  return (
    <div className={styles.leftBottomFrame}>
      <Image
        isBlurred
        src={`/plant_images/land_plot.png`}
        alt="Plant Land Plot"
        className={styles.currentPlant}
      />
      {sessions.map(session => {
        const { plantNumber, plantStage } = session;
        const imageUrl = images.get(plantNumber);
        
        if (imageUrl) {
          return (
            <Image
              key={session.id}
              src={imageUrl}
              alt={`Plant ${plantNumber} Stage ${plantStage}`}
              className={styles.sessionImage}
              style={{ position: 'absolute', top: '0', left: '0' }} // Adjust positioning as needed
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default Forest;
