"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Tab } from '@nextui-org/tabs';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@nextui-org/react';
import Image from 'next/image';
import { usePathname } from "next/navigation";
import styles from './dashboard-right-top.module.css';
import { LogSession, getSessions } from "../../../firebase";

// Helper function to format time as MM:SS
const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
  const seconds = (time % 60).toString().padStart(2, '0');

  return hours === 0 ? `${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`;
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
            clearInterval(timerInterval); // Clear the interval immediately
  
            if (!hasLoggedSessionRef.current) {
              LogSession({
                startDate: new Date(Date.now() - timerDuration * 60 * 1000),
                endDate: new Date(),
                type: "timer",
                length: timerDuration,
              });
              hasLoggedSessionRef.current = true; // Set the ref to prevent multiple logging
            }
  
            setIsTimerRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  
    return () => clearInterval(timerInterval);
  }, [isTimerRunning, timerDuration]);
  
  

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(new Date()); // Set start time
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleEnd = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    const end = new Date();
    setEndTime(end);
  
    LogSession({
      startDate: startTime,
      endDate: end,
      type: 'stopwatch',
      length: time,
    });
  };

  const handleTimerSelect = (duration: number) => {
    setTimerDuration(duration);
    setTimerTime(duration * 60);
    setIsTimerRunning(true);
    setIsTimerSelected(true);
    setIsTimerEnded(false);
    setStartTime(new Date());
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
