"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Tab } from '@nextui-org/tabs';
import { Image, ScrollShadow, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Modal, ModalBody, ModalHeader, ModalContent, ModalFooter } from '@nextui-org/react';
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

  //Plant growth
  const [currentPlant, setCurrentPlant] = useState<number>(1);
  const [currentStage, setCurrentStage] = useState<number>(4);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [plantsAtStage4, setPlantsAtStage4] = useState<{ id: number }[]>([]);

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

  const checkImageExists = async (src: string): Promise<boolean> => {
    try {
      const response = await fetch(src, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (timerDuration > 0) {
      const stages = Math.ceil(timerDuration / 45); // Calculate stage based on 45 mins
      setCurrentStage(Math.min(stages, 4)); // Ensure stage doesn't exceed 4
    }
  }, [timerDuration]);
  

useEffect(() => {
  fetch('/plant_images/plantImages.json')
    .then(response => response.json())
    .then(async (data: string[]) => {
      const validImages = await Promise.all(
        data.map(async (_, index) => {
          const imgSrc = `/plant_images/plant_${index + 1}_stage_4.png`;
          const exists = await checkImageExists(imgSrc);
          return exists ? { id: index + 1 } : null;
        })
      );
      setPlantsAtStage4(validImages.filter(Boolean) as { id: number }[]);
    })
    .catch(error => console.error('Error fetching plant images:', error));
}, []);
  


useEffect(() => {
  const savedSessionId = localStorage.getItem('currentSessionId');
  const savedStartTime = localStorage.getItem('startTime');
  const savedTime = localStorage.getItem('time');
  const savedIsPaused = localStorage.getItem('isPaused') === 'true';
  const savedPlant = localStorage.getItem('currentPlant');

  if (savedSessionId && savedStartTime && savedTime) {
    setIsRunning(true);
    setIsPaused(savedIsPaused);
    setStartTime(new Date(savedStartTime));
    setTime(parseInt(savedTime, 10));
    setCurrentPlant(parseInt(savedPlant || '1')); // Restore current plant
    setTabsSelected('stopwatch');  // Default to the Stopwatch tab

    const now = new Date();
    const elapsedTime = Math.floor((now.getTime() - (startTime?.getTime() || 0)) / 1000);
    localStorage.setItem('time', elapsedTime.toString());
  }
}, []);

  
  
  

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
    let timerId: NodeJS.Timeout | null = null; // Initialize with null
  
    if (isRunning && !isPaused) {
      timerId = setInterval(() => {
        if (startTime) {
          const elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
          setTime(elapsedTime);
          localStorage.setItem('time', elapsedTime.toString());
        }
      }, 1000);
    } else if (timerId) {
      clearInterval(timerId); // Check if timerId is not null before clearing
    }
  
    return () => {
      if (timerId) clearInterval(timerId); // Check if timerId is not null before clearing
    };
  }, [isRunning, isPaused, startTime]);
  
  
  
  
  
  
  

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
  
    if (isTimerRunning && !isTimerEnded) {
      interval = setInterval(() => {
        setTimerTime(prevTime => {
          if (prevTime <= 1) {
            setIsTimerRunning(false);
            setIsTimerEnded(true);
            playSound(); // Play sound when timer ends
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
  
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isTimerEnded]);
  
  
  

  const handleStart = async () => {
    const start = new Date();
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(start);
    localStorage.setItem('startTime', start.toISOString());
    localStorage.setItem('time', '0');
    localStorage.setItem('isPaused', 'false');
    localStorage.setItem('currentPlant', currentPlant.toString());
    
    setCurrentStage(1); // Initialize plant stage
  
    try {
      const sessionId = await LogSession({
        startDate: start,
        endDate: '',
        type: 'stopwatch',
        length: '',
        plantNumber: currentPlant,
        plantStage: 1 // Initial stage
      });
  
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
    localStorage.setItem('time', time.toString());
    localStorage.setItem('isPaused', 'true');
  };

  const handleResume = () => {
    setIsPaused(false);
    localStorage.setItem('isPaused', 'false');
  };



  const formatStopwatchLength = (durationInSeconds: number) => {
    if (durationInSeconds < 10) {
      return `${durationInSeconds}s`; // Format seconds for very short durations
    } else if (durationInSeconds < 60) {
      return `${durationInSeconds}s`; // Format seconds for durations under one minute
    }
  
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;
  
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
  
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
  
    return `${seconds}s`;
  };
  
  const calculatePlantStage = (elapsedTime: number, totalDuration: number) => {
    // Divide the total timer duration into 4 stages
    const totalStages = 4;
    const stageDuration = totalDuration / totalStages; // Duration for each stage in seconds
    const stage = Math.min(Math.floor(elapsedTime / stageDuration) + 1, totalStages); // Calculate the current stage
    return stage;
  };
  
  

  

  const handleEnd = async () => {
    setIsTimerRunning(false);
    setIsPaused(false);
    setTimerTime(0);
    const end = new Date(); // Capture the current end time
    setEndTime(end);
  
    const sessionId = localStorage.getItem('currentSessionId');
    const savedStartTime = localStorage.getItem('startTime');
  
    if (sessionId && savedStartTime) {
      try {
        const firestore = getFirestore();
        const sessionRef = doc(firestore, 'sessions', sessionId);
  
        const startTime = new Date(savedStartTime);
        const elapsedTime = Math.floor((end.getTime() - startTime.getTime()) / 1000);
        const length = formatStopwatchLength(elapsedTime);
  
        // Update session document with end date and length
        await updateDoc(sessionRef, {
          endDate: end,           // Log the end date
          length: length,         // Log the duration
          plantStage: calculatePlantStage(elapsedTime, timerDuration * 60),
        });
  
        console.log('Session updated successfully with end date and duration.');
      } catch (error) {
        console.error('Error updating session:', error);
      }
    } else {
      console.error('No session ID or start time found. Cannot update session.');
    }
  
    // Clean up local storage and reset timer state
    localStorage.removeItem('currentSessionId');
    localStorage.removeItem('startTime');
    localStorage.removeItem('time');
    localStorage.removeItem('isPaused');
  
    setIsTimerSelected(false);
    setIsTimerEnded(true);
    setStartTime(null);
    setTimerTime(0);
    setTime(0);
    setIsRunning(false);
    setIsPaused(false);
  };
  
  
  
  
 
  
  const handleTimerSelect = async (duration: number) => {
    const start = new Date();
    setTimerDuration(duration);
    setTimerTime(duration * 60);
    setIsTimerRunning(true);
    setIsTimerSelected(true);
    setIsTimerEnded(false);
    setStartTime(start);
  
    try {
      const sessionId = await LogSession({
        startDate: start,
        endDate: '', // Initial empty end date
        type: 'timer',
        length: duration,
      });
  
      if (sessionId && typeof sessionId === 'string') {
        localStorage.setItem('currentSessionId', sessionId);
        localStorage.setItem('startTime', start.toISOString()); // Save start time
      } else {
        console.error('Error: sessionId is not a string or is undefined');
      }
    } catch (error) {
      console.error('Error logging new session:', error);
    }
  };
  
  

  const [tabsSelected, setTabsSelected] = useState<string>('timer');


  const handleTabChange = (key: string | number) => {
    setTabsSelected(key.toString());
  };
  const handleImageClick = () => {
    setIsOpen(true);
  };
  const handlePlantClick = (id: number) => {
    setCurrentPlant(id);
    setIsOpen(false); // Optionally close the modal after selection
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
        <div className={styles.picRight} onClick={handleImageClick}>
        <Image
          isBlurred
          width={250}
          src={`/plant_images/plant_${currentPlant}_stage_${currentStage}.png`}
          alt={`Plant ${currentPlant} Stage ${currentStage}`}
          className={styles.currentPlant}
        />

      </div>

      </div>
      <div className={styles.bottomTabs}>
        <Tabs aria-label="Tabs" selectedKey={tabsSelected} onSelectionChange={handleTabChange}>
          <Tab key="timer" title="Timer"/>
          <Tab key="stopwatch" title="Stopwatch"/>
        </Tabs>
      </div>
      <audio ref={audioRef} src="/alarm.mp3" />


      <Modal size="xl" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalContent className={styles.modalContent}>
          <ModalHeader className="text-center text-xl font-bold">Choose Plant</ModalHeader>
          <ModalBody className="p-5">
          <ScrollShadow orientation="horizontal" className="w-full max-h-[400px]">
            <div className={styles.plantImages}>
              {plantsAtStage4.map((plant) => (
                <div onClick={() => handlePlantClick(plant.id)} key={plant.id} className={styles.imageContainer}>
                  <Image
                    className="w-[150px] h-[150px]"
                    src={`/plant_images/plant_${plant.id}_stage_4.png`}
                    alt={`Plant ${plant.id} Stage 4`}
                    onError={() => console.error(`Image not found: /plant_images/plant_${plant.id}_stage_4.png`)}
                  />
                </div>
              ))}
            </div>
          </ScrollShadow>
          </ModalBody>
        </ModalContent>
      </Modal>






    </div>



  );
};

export default RightSide;