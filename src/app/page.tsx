"use client";
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import LeftTop from './components/dashboard-left-top';
import LeftBottom from './components/dashboard-left-bottom';
import RightTop from './components/dashboard-right-top';
import RightBottom from './components/dashboard-right-bottom';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Input, Textarea, Card, CardHeader, CardBody, CardFooter } from "@nextui-org/react";
import { FaCalendar, FaClock, FaEdit, FaRegStickyNote, FaTrash } from "react-icons/fa";
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirestore, collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase.js';
import TaskModal from './components/task-modal';
import HeaderMain from './components/header';
import HabitProgressCircle from './stats/HabitProgressCircle'
import { format, eachDayOfInterval, subDays, addDays } from 'date-fns';
import HabitCards from './stats/HabitCards';
import { ScrollShadow } from '@nextui-org/react';

// Define the type for session logs
interface Session {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  length: string;
  name?: string;
  description?: string; 
}

interface Habit {
  id: string;
  name: string;
  status: string;
  color: string;
  habit_id: string;
  emoji: string;
}

interface HabitLog {
  id: string;
  date: string; // Ensure this is a date string in your Firestore documents
  habit_id: string;
  status: string;
  emoji: string;
}

interface Task {
  id: string;
  completedAt: string; // or Date if you prefer
  status: string;
  date: string;
  emoji: string;
}


const Page: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  // Add these for habits
  const [mainProgress, setMainProgress] = useState<{ date: string; percentage: number }[]>([]);
  const [habitsProgress, setHabitsProgress] = useState<{ date: string; habits: { name: string; status: string; color: string; habit_id?: string; emoji: string;}[] }[]>([]);
  const [hasFetchedHabitsAndTasks, setHasFetchedHabitsAndTasks] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [todayHabits, setTodayHabits] = useState<Habit[]>([]);


  // Handle session selection
  const handleSessionSelect = (session: Session | null) => {
    setSelectedSession(session); // Set the selected session
    setSelectedTask(null); // Clear any selected task to avoid conflicts
    onOpen(); // Open the modal when a session is selected
};

const OpenNewTaskModal = (isClicked: boolean, date: Date) => {
  if (isClicked) {
    // Helper function to format date to 'YYYY-MM-DDTHH:MM'
    const formatDateForSending = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const dateToSend = formatDateForSending(date);

    setSelectedTask(null); // Clear any previously selected task
    setSelectedDate(dateToSend); // Set the formatted date
    setIsTaskModalOpen(true); // Open the modal
    console.log('Sending Date: ' + dateToSend);
  }
};


const OpenEditTaskModal = (isClicked: boolean, task: any) => {
  if (isClicked) {
      setSelectedSession(null); // Clear any selected session to avoid conflicts
      setSelectedTask(task); // Set the task to be edited
      setIsTaskModalOpen(true); // Open the modal
  }
};
  
useEffect(() => {
  const unsubscribeTasks = onSnapshot(query(collection(db, "tasks")), (snapshot) => {
    const fetchedTasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];

    // Process task progress
    const taskProgress = fetchedTasks.reduce(
      (acc: { [date: string]: { completed: number; total: number } }, task) => {
        let taskDate;
        try {
          taskDate = new Date(task.date);
          if (isNaN(taskDate.getTime())) throw new Error("Invalid date");
        } catch {
          console.error(`Invalid task date: ${task.date}`);
          return acc;
        }

        const formattedDate = format(taskDate, "M/d/yyyy");
        if (!acc[formattedDate]) {
          acc[formattedDate] = { completed: 0, total: 0 };
        }
        acc[formattedDate].total += 1;
        if (task.status === "Completed") {
          acc[formattedDate].completed += 1;
        }
        return acc;
      },
      {}
    );

    const mainProgress = Object.entries(taskProgress).map(
      ([date, { completed, total }]) => ({
        date,
        percentage: total === 0 ? 0 : (completed / total) * 100,
      })
    );

    setTasks(fetchedTasks);
    setMainProgress(mainProgress);
  });

  const unsubscribeHabits = onSnapshot(query(collection(db, "habits", "main", "habits_refrence")), (snapshot) => {
    const fetchedHabits = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Habit[];

    const unsubscribeHabitLogs = onSnapshot(query(collection(db, "habits", "main", "habits_log")), (snapshot) => {
      const habitsLogs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HabitLog[];

      // Process habit log data
      const startOfTwoMonthDate = subDays(new Date(), 10);
      const endOfTwoMonthDate = addDays(new Date(), 10);
      const weekDates = eachDayOfInterval({ start: startOfTwoMonthDate, end: endOfTwoMonthDate }).map(date => format(date, "M/d/yyyy"));

      const existingDates = new Set(habitsLogs.map(log => format(new Date(log.date), "M/d/yyyy")));
      const habitMap = new Map(fetchedHabits.map(habit => [habit.habit_id, habit]));

      const habitData = weekDates.reduce((acc: { [date: string]: { name: string; status: string; color: string; habit_id: string, emoji: string; }[] }, date) => {
        const logsForDate = habitsLogs.filter(log => format(addDays(new Date(log.date), 1), "M/d/yyyy") === date);
        const habitsForDate = fetchedHabits.map(habit => {
          const logForHabit = logsForDate.find(log => log.habit_id === habit.habit_id);
          return logForHabit
            ? { ...logForHabit, name: habit.name, color: habit.color }
            : { name: habit.name, status: "Incomplete", color: habit.color, habit_id: habit.habit_id, emoji: habit.emoji };
        });
        acc[date] = habitsForDate;
        return acc;
      }, {});

      const habitsProgressArray = Object.entries(habitData).map(([date, habits]) => ({
        date,
        habits,
      }));

      setHabitsProgress(habitsProgressArray);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeHabits();
    };
  });
}, []);



useEffect(() => {
  if (habitsProgress.length > 0) {
    const today = format(new Date(), 'M/d/yyyy');
    const todaysData = habitsProgress.find((progress) => progress.date === today);
    
    if (todaysData) {
      const habitsWithId = todaysData.habits.map(habit => ({
        id: habit.habit_id || '', // Ensure id is a string
        name: habit.name,
        status: habit.status,
        color: habit.color,
        habit_id: habit.habit_id || '',
        emoji: habit.emoji,
      }));
      
      setTodayHabits(habitsWithId);
    }
  }
}, [habitsProgress]);




  return (
<div className="overflow-hidden">
  <HeaderMain />
    <div className={styles.mainContainer}>
      <div className={styles.habitFrame}>
        <div className={styles.habitFrameLeft}>
          <HabitProgressCircle
            mainProgress={mainProgress}
            habitsProgress={habitsProgress}
            moduleType={"day"}
          />
        </div>
        <div className={styles.habitFrameRight}>

            <div className="flex flex-col justify-items-stretch">
              <div className={styles.headingText}>Habits</div>
              <ScrollShadow className={styles.scrollShado}>
                <div className={styles.habitCards}>
                  <HabitCards habits={todayHabits} />
                </div>
                </ScrollShadow>
            </div>
        </div>
      </div>
    <div className={styles.container}>
      <div className={styles.leftFrame}>
        <LeftTop
          onNewTaskClick={OpenNewTaskModal}
          onEditTaskClick={OpenEditTaskModal}  // New prop for editing tasks
          tasks={tasks} // Ensure tasks is provided
          setTasks={setTasks} // Ensure setTasks is provided
        />
        <LeftBottom />
      </div>
      <div className={styles.rightFrame}>
        <RightTop />
        <RightBottom 
          onModalOpenChange={onOpenChange} 
          onSessionSelect={handleSessionSelect} 
        />
      </div>
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)}
        onNewTaskClick={OpenNewTaskModal}  
        onSave={() => {}}  
        initialDate={selectedDate}  // Pass the date as a string
        task={selectedTask}   // Add this line to pass the selected session
      />

      <Modal placement='center' size="4xl" isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => {
          const handleSave = async () => {
            if (selectedSession) {
              try {
                const firestore = getFirestore();
                const sessionRef = doc(db, 'sessions', selectedSession.id);
                await updateDoc(sessionRef, {
                  name: selectedSession.name || '',
                  description: selectedSession.description || '',
                });
                onClose();  // Close the modal after saving
                console.log('Session updated successfully with data: ' + selectedSession.name + selectedSession.description);
              } catch (error) {
                console.error('Error updating session:', error);
              }
            }
          };
          return (
            <>
              <ModalHeader className="items-center flex flex-row gap-3 text-3xl">
              <FaTrash
                className="text-2xl text-red-500 cursor-pointer"
                onClick={async () => {
                  if (selectedSession) {
                    try {
                      const firestore = getFirestore();
                      const sessionRef = doc(db, 'sessions', selectedSession.id);
                      await deleteDoc(sessionRef);  // Function to delete the document
                      onClose();  // Close the modal after deleting
                      console.log('Session deleted successfully');
                    } catch (error) {
                      console.error('Error deleting session:', error);
                    }
                  }
                }}
              /> 
                <span>Session Details</span>
                </ModalHeader>
              <ModalBody>
                {selectedSession ? (
                  <div>
                    <Input
                      className={styles.paddingBottom}
                      radius="md" 
                      size="md" 
                      type="name" 
                      label="Name" 
                      onValueChange={(value) => setSelectedSession({ ...selectedSession, name: value })}
                      defaultValue={selectedSession?.name || ''}
                      placeholder="Enter Name"
                      labelPlacement="inside"
                      startContent={
                        <FaEdit className="mb-0.5 text-1xl text-default-400 pointer-events-none flex-shrink-0" />
                      }
                      />
                    <Textarea
                      className={styles.paddingBottom}
                      radius="md" 
                      size="md" 
                      type="description" 
                      label="Description" 
                      onValueChange={(value) => setSelectedSession({ ...selectedSession, description: value })}
                      defaultValue={selectedSession?.description || ''}
                      placeholder="Enter Description"
                      labelPlacement="inside"
                      startContent={
                        <FaRegStickyNote className="text-1xl text-default-400 pointer-events-none flex-shrink-0" />
                      }
                      />
                    <Input 
                      className={styles.paddingBottom}
                      radius="md" 
                      isReadOnly 
                      size="md" 
                      type="startDate" 
                      label="Start Date" 
                      defaultValue={selectedSession.startDate}
                      labelPlacement="inside"
                      startContent={
                        <FaCalendar className="mb-0.5 text-1xl text-default-400 pointer-events-none flex-shrink-0" />
                      }
                      />
                    <Input
                      className={styles.paddingBottom}
                      radius="md" 
                      isReadOnly 
                      size="md" 
                      type="endDate" 
                      label="End Date" 
                      defaultValue={selectedSession.endDate}
                      labelPlacement="inside"
                      startContent={
                        <FaCalendar className="mb-0.5 text-1xl text-default-400 pointer-events-none flex-shrink-0" />
                      }
                      />
                    <Input 
                      className={styles.paddingBottom}
                      radius="md" 
                      isReadOnly 
                      size="md" 
                      type="length" 
                      label="Length" 
                      defaultValue={selectedSession.length}
                      labelPlacement="inside"
                      startContent={
                        <FaClock className="mb-0.5 text-1xl text-default-400 pointer-events-none flex-shrink-0" />
                      }
                      />
                    <p><strong>Type:</strong> {selectedSession.type}</p>
                  </div>
                ) : (
                  <p>No session selected</p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="secondary" onPress={handleSave}>
                  Save
                </Button>
              </ModalFooter>
            </>
          );
        }}
      </ModalContent>
      </Modal>
    </div>
    </div>
  );
};

export default Page;