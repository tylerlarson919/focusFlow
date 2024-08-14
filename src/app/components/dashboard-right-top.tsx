"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Tab } from '@nextui-org/tabs';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@nextui-org/react';
import Image from 'next/image';
import { usePathname } from "next/navigation";
import styles from './dashboard-right-top.module.css';
import { LogSession, getSessions, db } from "../../../firebase";
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

// Helper function to format time as MM:SS
// Helper function to format time as HH:MM:SS
const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
  const seconds = (time % 60).toString().padStart(2, '0');

  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
};


const RightSide: React.FC = () => {
  // Stopwatch state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);

  // Timer state
  const [timerDuration, setTimerDuration] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerTime, setTimerTime] = useState(0);
  const [isTimerSelected, setIsTimerSelected] = useState(false);
  const [isTimerEnded, setIsTimerEnded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);


  //Store start and end times
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const hasLoggedSessionRef = useRef(false);



  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    const handleClick = () => {
      stopAudio();
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
  
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
  
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);
  

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
  
    if (isTimerRunning) {
      timerInterval = setInterval(() => {
        setTimerTime(prevTime => {
          if (prevTime <= 1) {
            playSound();
            handleEnd();
            clearInterval(timerInterval); // Clear the interval immediately
            setIsTimerRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  
    return () => clearInterval(timerInterval);
  }, [isTimerRunning, timerDuration]);
  
  

  const handleStart = async () => {
    const start = new Date(); 
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(start); // Set start time
  
    try {
      const sessionId = await LogSession({
        startDate: start,
        endDate: '',
        type: 'stopwatch',
        length: '',
      });
  
      // Ensure sessionId is a string before storing
      if (typeof sessionId === 'string') {
        localStorage.setItem('currentSessionId', sessionId);
      } else {
        console.error('Error: sessionId is not a string');
      }
    } catch (error) {
      console.error('Error logging new session:', error);
    }
  };
  
  

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };



  const formatStopwatchLength = (durationInSeconds: number) => {
    if (durationInSeconds < 60) {
      return `${durationInSeconds}s`; // Format seconds
    }
  
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
  
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
  
    return `${minutes}m`;
  };

  

  const handleEnd = async () => {
    setIsTimerRunning(false);
    setIsPaused(false);
    setTimerTime(0);
    const end = new Date();
    setEndTime(end);
  
    const durationInSeconds = Math.floor((end.getTime() - (startTime?.getTime() || 0)) / 1000);
  
    // Retrieve session ID from localStorage
    const sessionId = localStorage.getItem('currentSessionId');
    if (sessionId) {
      try {
        const firestore = getFirestore();
        const sessionRef = doc(firestore, 'sessions', sessionId);
  
        // Update the existing session
        await updateDoc(sessionRef, {
          endDate: end,
          length: formatStopwatchLength(durationInSeconds), // Use the correct format
        });
  
        console.log('Session updated successfully with data: ' + end + ' ' + durationInSeconds);
      } catch (error) {
        console.error('Error updating session:', error);
      }
    } else {
      console.error('No session ID found. Cannot update session.');
    }
  
    // Reset states to show the dropdown menu again
    setIsTimerSelected(false);
    setIsTimerEnded(true);
    setStartTime(null);
    setTimerTime(0);
    setTime(0);
    setIsRunning(false);
    setIsPaused(false);
  
    // Clear the session ID from localStorage after updating
    localStorage.removeItem('currentSessionId');
  };
  
  
  
  
  
  
  
  
  

  const handleTimerSelect = async (duration: number) => {
    setTimerDuration(duration);
    setTimerTime(duration * 60);
    setIsTimerRunning(true);
    setIsTimerSelected(true);
    setIsTimerEnded(false);
    setStartTime(new Date());
  
    // Create a new session and store the session ID
    try {
      const sessionId = await LogSession({
        startDate: new Date(),
        endDate: '',
        type: 'timer',
        length: duration,
      });
  
      // Ensure sessionId is a string before storing
      if (sessionId && typeof sessionId === 'string') {
        localStorage.setItem('currentSessionId', sessionId);
      } else {
        console.error('Error: sessionId is not a string or is undefined');
      }
    } catch (error) {
      console.error('Error logging new session:', error);
    }
  };
  
  
  const getButtonProps = () => {
    if (!isRunning) {
      return { text: 'Start', onClick: handleStart };
    } else if (isPaused) {
      return { text: 'Resume', onClick: handleResume };
    } else {
      return { text: 'Pause', onClick: handlePause };
    }
  };

  const pathname = usePathname();

  const [tabsSelected, setTabsSelected] = useState<string>('timer'); // Default to 'timer'

  const handleTabChange = (key: string | number) => {
    setTabsSelected(key.toString());
  };

  return (
    <div className={styles.rightTopFrame}>
      <div className={styles.topContent}>
        <div className={styles.infoLeft}>
          {tabsSelected === 'stopwatch' ? (
            <>
              <h3>{formatTime(time)}</h3>
              <div className={styles.buttons}>
                {isRunning && !isPaused ? (
                  <>
                    <Button color="secondary" variant="bordered" className="width-100" onClick={handlePause}>
                      Pause
                    </Button>
                    <Button color="secondary" variant="bordered" className="width-100" onClick={handleEnd}>
                      End
                    </Button>
                  </>
                ) : (
                  <Button color="secondary" variant="bordered" className="width-100" onClick={handleStart}>
                    {isPaused ? 'Resume' : 'Start'}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <h3>{formatTime(timerTime)}</h3>
              <div className={styles.buttons}>
                {isTimerSelected && !isTimerEnded ? (
                  <Button color="secondary" variant="bordered" className="width-100" onClick={() => setIsTimerRunning(prev => !prev)}>
                    {isTimerRunning ? 'Pause' : 'Resume'}
                  </Button>
                ) : (
                  <Dropdown>
                    <DropdownTrigger>
                      <Button color="secondary" variant="bordered" className="width-100">
                        Select Timer
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Timer Options">
                      {[0.1, 5, 10, 15, 30, 45, 60, 120, 240].map(minutes => (
                        <DropdownItem key={minutes} onClick={() => handleTimerSelect(minutes)}>
                          {minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                )}
              </div>
            </>
          )}
        </div>
        <div className={styles.picRight}>
          <Image className={styles.currentPlant} alt="" src="/plant-placeholder.png" width={200} height={200} />
        </div>
      </div>
      <div className={styles.bottomTabs}>
        <Tabs aria-label="Tabs" selectedKey={tabsSelected} onSelectionChange={handleTabChange}>
          <Tab key="timer" title="Timer"/>
          <Tab key="stopwatch" title="Stopwatch"/>
        </Tabs>
      </div>
      <audio ref={audioRef} src="/alarm.mp3" />
    </div>
  );
};

export default RightSide;