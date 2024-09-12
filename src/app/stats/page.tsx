"use client";
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import StatsChart from './stats-chart';
import HeaderMain from '../components/header';
import { DateRangePicker, RangeValue, DateValue, Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from "@nextui-org/react";
import { collection, query, getDocs, writeBatch, doc, Timestamp } from "firebase/firestore";
import { db  } from "../../../firebase";
import { startOfWeek, endOfWeek, startOfMonth, startOfYear, format, eachDayOfInterval, subDays, addDays } from 'date-fns';
import { convertLengthToMinutes, parseDate, sortDataByDate } from './utils';
import HabitProgressCircle from './HabitProgressCircle'


interface Habit {
  id: string;
  name: string;
  status: string;
  color: string;
  habit_id: string;
}

interface HabitLog {
  id: string;
  date: string; // Ensure this is a date string in your Firestore documents
  habit_id: string;
  status: string;
}

interface Task {
  id: string;
  completedAt: string; // or Date if you prefer
  status: string;
  date: string;
}



const StatsPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<RangeValue<DateValue> | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("day");
  const [chartData, setChartData] = useState<{ name: string; totalLength: number }[]>([]);
  // Add these for habits
  const [mainProgress, setMainProgress] = useState<{ date: string; percentage: number }[]>([]);
  const [habitsProgress, setHabitsProgress] = useState<{ date: string; habits: { name: string; status: string; color: string }[] }[]>([]);
  const [hasFetchedHabitsAndTasks, setHasFetchedHabitsAndTasks] = useState(false);
  const [isFetching, setIsFetching] = useState(false);


  useEffect(() => {
    const fetchSessions = async () => {
      console.log('Fetching sessions...');
      const sessionsQuery = query(collection(db, "sessions"));
      const querySnapshot = await getDocs(sessionsQuery);
      const fetchedSessions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Fetched sessions:', fetchedSessions);
      setSessions(fetchedSessions);
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    const sortSessions = () => {
      console.log('Sorting sessions...');
      let filteredSessions = sessions;
    
      if (dateRange && dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start.year, dateRange.start.month - 1, dateRange.start.day);
        const endDate = new Date(dateRange.end.year, dateRange.end.month - 1, dateRange.end.day);
    
        filteredSessions = sessions.filter((session) => {
          const sessionDate = parseDate(session.startDate);
    
          if (!sessionDate || isNaN(sessionDate.getTime())) {
            console.error(`Invalid session date: ${session.startDate}`);
            return false;
          }
    
          const isInRange = sessionDate >= startDate && sessionDate <= endDate;
          return isInRange;
        });
      } else {
        console.log('No date range selected, displaying all sessions.');
      }
    
      const data = filteredSessions.reduce((acc: { name: string; totalLength: number }[], session) => {
        const sessionDate = parseDate(session.startDate);
        if (!sessionDate) {
          console.error(`Error parsing date: ${session.startDate}`);
          return acc;
        }
    
        let formattedDate: string;
        try {
          switch (selectedPeriod) {
            case 'week':
              // Get the start of the week
              const startOfWeekDate = startOfWeek(sessionDate, { weekStartsOn: 1 }); // Assuming week starts on Monday
              formattedDate = format(startOfWeekDate, 'M/d/yyyy');
              break;
            case 'month':
              // Get the start of the month
              const startOfMonthDate = startOfMonth(sessionDate);
              formattedDate = format(startOfMonthDate, 'M/d/yyyy');
              break;
            case 'year':
              // Get the start of the year
              const startOfYearDate = startOfYear(sessionDate);
              formattedDate = format(startOfYearDate, 'M/d/yyyy');
              break;
            case 'day':
            default:
              // Use the exact date
              formattedDate = format(sessionDate, 'M/d/yyyy');
              break;
          }
        } catch (error) {
          console.error('Error formatting date:', sessionDate, error);
          return acc;
        }
    
        const sessionLengthInMinutes = convertLengthToMinutes(session.length);
        const existingDateEntry = acc.find((entry) => entry.name === formattedDate);
        if (existingDateEntry) {
          existingDateEntry.totalLength += sessionLengthInMinutes;
        } else {
          acc.push({ name: formattedDate, totalLength: sessionLengthInMinutes });
        }
    
        return acc;
      }, []);
    
      const sortedData = sortDataByDate(data);
      setChartData(sortedData);
    };
    

    sortSessions();
  }, [sessions, dateRange, selectedPeriod]);



  useEffect(() => {
    const fetchHabitsAndTasks = async () => {
      if (isFetching) return; // Prevent execution if already fetching
    
      setIsFetching(true);
      console.log("Fetching habits and tasks...");
    
      try {
        // Fetch tasks
        const tasksQuery = query(collection(db, "tasks"));
        const tasksSnapshot = await getDocs(tasksQuery);
        const fetchedTasks = tasksSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Task[];
    
        if (fetchedTasks.length === 0) {
          console.warn("No tasks found.");
        }
    
        // Process task progress data
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
    
        // Fetch habits from habits_reference
        const habitsRefrenceQuery = query(collection(db, "habits", "main", "habits_refrence"));
        const habitsRefrenceSnapshot = await getDocs(habitsRefrenceQuery);
        const fetchedHabits = habitsRefrenceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Habit[];
    
        if (fetchedHabits.length === 0) {
          console.warn("No habits found.");
        }
    
        // Fetch habits_log data
        const habitsLogsQuery = query(collection(db, "habits", "main", "habits_log"));
        const habitsLogsSnapshot = await getDocs(habitsLogsQuery);
        const habitsLogs = habitsLogsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HabitLog[];
    
        // Get the start and end of the current week
        const startOfTwoMonthDate = subDays(new Date(), 30);
        const endOfTwoMonthDate = addDays(new Date(), 30);
        const weekDates = eachDayOfInterval({ 
          start: startOfTwoMonthDate, 
          end: endOfTwoMonthDate 
        }).map(date => format(date, "M/d/yyyy"));
            
        // Create new documents in habits_log if missing for the week
        const existingDates = new Set(habitsLogs.map(log => format(new Date(log.date), "M/d/yyyy")));
        
        // Map fetched habits for easier lookup by habit_id
        const habitMap = new Map(fetchedHabits.map((habit) => [habit.habit_id, habit]));
    
        // Process habit log data
        const habitData = weekDates.reduce((acc: { [date: string]: { name: string; status: string; color: string; habit_id: string }[] }, date) => {
          const logsForDate = habitsLogs.filter(log => format(addDays(new Date(log.date), 1), "M/d/yyyy") === date);
          const habitsForDate = fetchedHabits.map(habit => {
            const logForHabit = logsForDate.find(log => log.habit_id === habit.habit_id);
            return logForHabit
              ? { ...logForHabit, name: habit.name, color: habit.color }
              : { name: habit.name, status: "Incomplete", color: habit.color, habit_id: habit.habit_id };
          });
          acc[date] = habitsForDate;
          return acc;
        }, {});
        


        // Convert habitData to an array of objects with date and habits
        const habitsProgressArray = Object.entries(habitData).map(([date, habits]) => ({
          date,
          habits,
        }));
    
        // Update state with processed data
        setHabitsProgress(habitsProgressArray);
        setMainProgress(mainProgress);
        console.log("Habits progress:", habitsProgressArray); // Updated to show aggregated data
        console.log("Main progress:", mainProgress);
      } catch (error) {
        console.error("Error fetching habits and tasks:", error);
      } finally {
        setIsFetching(false); // Reset fetching flag
      }
    };
    
    if (!hasFetchedHabitsAndTasks) {
  
      fetchHabitsAndTasks();
      setHasFetchedHabitsAndTasks(true); // Set the state to true after fetching
    }
  }, [hasFetchedHabitsAndTasks]);
  
  
  
  

  const handleDateRangeChange = (range: RangeValue<DateValue> | null) => {
  
    if (range && typeof range.start === 'object' && typeof range.end === 'object') {
      const { start, end } = range;
  
  
      // Update the state as RangeValue<DateValue>
      setDateRange({ start, end });
    } else {
      console.log('No valid date range selected');
      setDateRange(null); // Clear the date range if invalid
    }
  };

  return (
    <div className={styles.bg}>
      <div className={styles.header}>
        <HeaderMain className="top-0" />
      </div>
      <div className={styles.statsChart}>
        <div className={styles.topContent}>
          <h5>Stats</h5>
          <div className={styles.leftContent}>
            <Dropdown>
              <DropdownTrigger>
                <Button className='h-full' variant={"flat"}>
                  {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Period selector"
                onAction={(key) => {
                  console.log('Dropdown selected:', key);
                  setSelectedPeriod(key as string);
                }}
              >
                <DropdownSection>
                  <DropdownItem key="day">Day</DropdownItem>
                  <DropdownItem key="week">Week</DropdownItem>
                  <DropdownItem key="month">Month</DropdownItem>
                  <DropdownItem key="year">Year</DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
            <DateRangePicker
              aria-label="Date range picker"
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>
        <StatsChart data={chartData} />
      </div>
      <div className={styles.rowTwo}>
      <HabitProgressCircle
        mainProgress={mainProgress}
        habitsProgress={habitsProgress}
        moduleType={"week"}
      />
      </div>
    </div>
  );
};

export default StatsPage;
