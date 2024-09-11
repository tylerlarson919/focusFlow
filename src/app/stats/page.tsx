"use client";
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import StatsChart from './stats-chart';
import HeaderMain from '../components/header';
import { DateRangePicker, RangeValue, DateValue, Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from "@nextui-org/react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import { startOfWeek, startOfMonth, startOfYear, format } from 'date-fns';
import { convertLengthToMinutes, parseDate, sortDataByDate } from './utils';

const StatsPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<RangeValue<DateValue> | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("day");
  const [chartData, setChartData] = useState<{ name: string; totalLength: number }[]>([]);

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
        
      </div>

    </div>
  );
};

export default StatsPage;
