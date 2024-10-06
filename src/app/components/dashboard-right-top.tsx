"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tabs, Tab } from '@nextui-org/tabs';
import { Image, ScrollShadow, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Modal, ModalBody, ModalHeader, ModalContent, ModalFooter } from '@nextui-org/react';
import styles from './dashboard-right-top.module.css';
import { LogSession, getSessions, db } from "../../../firebase";
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Helper function to format time as MM:SS
// Helper function to format time as HH:MM:SS
const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
  const seconds = (time % 60).toString().padStart(2, '0');

  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
};



const RightSide: React.FC = () => {

  const [userId, setUserId] = useState<string | null>(null);
  const auth = getAuth();

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
              setUserId(user.uid);
          } else {
              setUserId(null);
          }
      });

      return () => unsubscribe();
  }, [auth]);


  // Stopwatch state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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
  const [elapsedTime, setElapsedTime] = useState(0); // Initialize with 0 or other default value


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
    } catch (error) {
      // Optionally log the error to an internal log or handle silently
      return false;
    }
  };
  
  

  useEffect(() => {
    if (timerDuration > 0) {
      const stageDuration = timerDuration * 60 / 4; // Divide timer duration by 4 for stage intervals
      const elapsed = timerDuration * 60 - timerTime; // Time elapsed in seconds
  
      const stage = Math.min(Math.floor(elapsed / stageDuration) + 1, 4);
      setCurrentStage(stage);
    }
  }, [timerTime, timerDuration]);
  
  

  useEffect(() => {
    fetch('/plant_images/plantImages.json')
      .then(response => response.json())
      .then(async (data: string[]) => {
        const validImages = await Promise.all(
          data.map(async (filename) => {
            const imgSrc = `/plant_images/${filename}`;
            const exists = await checkImageExists(imgSrc);
            if (exists) {
              const id = parseInt(filename.split('_')[1], 10);
              return { id }; // Ensure id is a number
            }
            return null;
          })
        );
  
        // Filter out null values and assert the type
        setPlantsAtStage4(
          validImages.filter((item): item is { id: number } => item !== null) as { id: number }[]
        );
      })
      .catch(error => console.error('Error fetching plant images:', error));
  }, []);
  
  
  


useEffect(() => {
  const savedSessionId = localStorage.getItem('currentSessionId');
  const savedStartTime = localStorage.getItem('startTime');
  const savedTime = localStorage.getItem('time');
  const savedIsPaused = localStorage.getItem('isPaused') === 'true';

  if (savedSessionId && savedStartTime && savedTime) {
    setIsRunning(true);
    setIsPaused(savedIsPaused);
    setStartTime(new Date(savedStartTime));
    setElapsedTime(parseInt(savedTime, 10));
    let savedPlant: string | null = localStorage.getItem('savedPlant');
    setCurrentPlant(parseInt(savedPlant || '1')); // Restore current plant
    setTabsSelected('stopwatch');  // Default to the Stopwatch tab

    const now = new Date();
    const elapsedTime = Math.floor((now.getTime() - (startTime?.getTime() || 0)) / 1000);
    localStorage.setItem('time', elapsedTime.toString());
  }
}, [startTime]);

  
  
  

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
    if (isRunning && !isPaused && startTime) {
      const interval = setInterval(() => {
        const currentTime = new Date().getTime();
        const elapsedTime = Math.floor((currentTime - startTime.getTime()) / 1000); // Elapsed time in seconds
  
        // Restore stageTimes array
        const stageTimes = [0, 900, 1800, 2700]; // 0s, 15m, 30m, 45m in seconds
  
        let stage = 1;
        for (let i = 0; i < stageTimes.length; i++) {
          if (elapsedTime >= stageTimes[i]) {
            stage = i + 1;
          } else {
            break;
          }
        }
  
        setCurrentStage(stage);
  
        // Update elapsed time display
        setElapsedTime(elapsedTime);
      }, 1000); // Update every second
  
      // Cleanup interval on component unmount or when stopwatch is paused/stopped
      return () => clearInterval(interval);
    }
  }, [isRunning, isPaused, startTime]);
  
  
  
  
  
  useEffect(() => {
    const fetchMostRecentSession = async () => {
      try {
        const sessions = await getSessions(); // Fetch all sessions
        if (sessions && sessions.length > 0) {
          const mostRecentSession = sessions.sort((a, b) => b.startDate - a.startDate)[0]; // Sort by startDate to get the most recent
          setCurrentPlant(mostRecentSession.plantNumber); // Set the default plant number
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
  
    fetchMostRecentSession();
  }, []);
  

;
  
  
  

  const handleStart = async () => {
    const start = new Date();
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(start);
    setElapsedTime(0); // Initialize elapsedTime to 0
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
        plantStage: 1,
        userId: userId,
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
    localStorage.setItem('time', elapsedTime.toString());
    localStorage.setItem('isPaused', 'true');
    localStorage.setItem('pauseTime', new Date().toISOString()); // Store pause time
};

const handleResume = () => {
  const pauseTime = new Date(localStorage.getItem('pauseTime') || '');
  const currentTime = new Date();
  
  // Calculate the pause duration in milliseconds
  const pauseDuration = currentTime.getTime() - pauseTime.getTime();
  
  if (startTime) {
      // Update the start time by adding the pause duration
      const updatedStartTime = new Date(startTime.getTime() + pauseDuration);
      setStartTime(updatedStartTime);
      localStorage.setItem('startTime', updatedStartTime.toISOString());
  }
  
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
    const end = new Date();
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
          endDate: end.toISOString(), // Save end date as ISO string
          length: length,
          plantStage: currentStage, // Update the stage here
          plantNumber: currentPlant,
          userId: userId,
        });
  
        console.log('Session updated successfully with end date and duration.');
      } catch (error) {
        console.error('Error updating session:', error);
      }
    } else {
      console.error('No session ID or start time found. Cannot update session.');
    }
  
    // Clean up local storage and reset state
    localStorage.removeItem('currentSessionId');
    localStorage.removeItem('startTime');
    localStorage.removeItem('time');
    localStorage.removeItem('isPaused');
  
    setIsTimerSelected(false);
    setIsTimerEnded(true);
    setStartTime(null);
    setTimerTime(0);
    setElapsedTime(0);
    setIsRunning(false);
    setIsPaused(false);
  };
  
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
  
    if (isTimerRunning && !isTimerEnded) {
      interval = setInterval(() => {
        setTimerTime(prevTime => {
          if (prevTime <= 1) {
            setIsTimerRunning(false);
            setIsTimerEnded(true);
            playSound(); // Play sound when timer ends
            handleEnd();
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
  }, [isTimerRunning, isTimerEnded, handleEnd]);
  
  
  
 
  
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


  const handleTabChange = useCallback((key: string | number) => {
    setTabsSelected(key.toString());
  }, []);
  
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
              <h3>{formatTime(elapsedTime)}</h3>
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
                  <Button color="secondary" variant="bordered" className="width-100" onClick={isPaused ? handleResume : handleStart }>
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


      <Modal placement='center' size="xl" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalContent className={styles.modalContent}>
          <ModalHeader className="text-center text-xl font-bold">Choose Plant</ModalHeader>
          <ModalBody className="p-5">
          <ScrollShadow orientation="vertical" className="w-full max-h-[400px]">
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