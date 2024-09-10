"use client";
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import StatsChart from './stats-chart';
import HeaderMain from '../components/header';
import { DateRangePicker, RangeValue, DateValue, Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from "@nextui-org/react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase"; // Ensure correct path
import { Timestamp } from 'firebase/firestore'; // Ensure correct import

const StatsPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<RangeValue<DateValue> | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("day"); // State for selected dropdown option

  useEffect(() => {
    const fetchSessions = async () => {
      let sessionsQuery;

      if (Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        const startDate = Timestamp.fromDate(dateRange[0].toDate());
        const endDate = Timestamp.fromDate(dateRange[1].toDate());
    
        sessionsQuery = query(
          collection(db, "sessions"),
          where("date", ">=", startDate),
          where("date", "<=", endDate)
        );
      } else {
        sessionsQuery = query(collection(db, "sessions"));
      }
    
      const querySnapshot = await getDocs(sessionsQuery);
      const fetchedSessions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSessions(fetchedSessions);
    };

    fetchSessions();
  }, [dateRange]);

  return (
    <div className={styles.bg}>
      <div className={styles.header}>
        <HeaderMain className="top-0" />
      </div>
      <div className={styles.statsChart}>
        <div className={styles.topContent}>
          <h5>Stats</h5>
          <div className={styles.leftContent}>
            <Dropdown >
              <DropdownTrigger>
                <Button className='h-full'
                  variant={"flat"}
                >
                  {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} {/* Display selected option */}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Period selector"
                onAction={(key) => setSelectedPeriod(key as string)}
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
              label="Stay duration"
              className="max-w-xs"
              value={dateRange}
              onChange={(value) => setDateRange(value)}
            />
          </div>
        </div>
        <StatsChart sessions={sessions} />
      </div>
    </div>
  );
};

export default StatsPage;
