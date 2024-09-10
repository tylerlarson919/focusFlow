"use client";
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import StatsChart from './stats-chart';
import HeaderMain from '../components/header';
import { DateRangePicker, RangeValue, DateValue, Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from "@nextui-org/react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import { format } from 'date-fns';
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
    
      if (Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        const startDate = new Date(dateRange[0]);
        const endDate = new Date(dateRange[1]);
        console.log('Date range:', startDate, endDate);
    
        filteredSessions = sessions.filter((session) => {
          const sessionDate = parseDate(session.startDate);
          console.log(`Session ${session.id} date:`, sessionDate);
    
          // Ensure the dates are valid before comparison
          if (!sessionDate || isNaN(sessionDate.getTime())) {
            console.error(`Invalid session date: ${session.startDate}`);
            return false;
          }
    
          const isInRange = sessionDate >= startDate && sessionDate <= endDate;
          console.log(`Session ${session.id} is in range: ${isInRange}`);
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
              formattedDate = format(sessionDate, 'w-yy');
              break;
            case 'month':
              formattedDate = format(sessionDate, 'M-yy');
              break;
            case 'year':
              formattedDate = format(sessionDate, 'yy');
              break;
            case 'day':
            default:
              formattedDate = format(sessionDate, 'M/d/yy');
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
    
      console.log('Data before sorting:', data);
      const sortedData = sortDataByDate(data);
      console.log('Sorted data:', sortedData);
      setChartData(sortedData);
    };

    sortSessions();
  }, [sessions, dateRange, selectedPeriod]);

  const handleDateRangeChange = (range: RangeValue<DateValue> | null) => {
    console.log('Range received:', range);
    if (range && Array.isArray(range) && range.length === 2) {
      const [start, end] = range;
  
      console.log('Start DateValue:', start);
      console.log('End DateValue:', end);
  
      // Assuming the DateRangePicker needs DateValue as { start, end }
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
    </div>
  );
};

export default StatsPage;
