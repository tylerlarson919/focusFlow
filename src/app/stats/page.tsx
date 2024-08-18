"use client"; // Ensure this file is rendered on the client side

import React, { useState, useEffect } from 'react';
import styles from './stats.module.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventContentArg } from '@fullcalendar/core';
import { getTasks } from '../../../firebase';
import { EventInput } from '@fullcalendar/core';

const StatsPage: React.FC = () => {
  const [events, setEvents] = useState<EventInput[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasks = await getTasks();
        console.log("Fetched tasks:", tasks); // Log fetched tasks to see what was returned
        
        if (tasks && tasks.length > 0) {
          const taskEvents: EventInput[] = tasks.map(task => ({
            title: task.name || 'No Title', // Fallback if 'name' is missing
            start: task.date ? new Date(task.date) : undefined, // Use the correct date property
            end: undefined, // No end date available, keep it undefined
          }));
          console.log("Processed task events:", taskEvents); // Log the processed events
          setEvents(taskEvents);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className={styles.bg}>
      <div className={styles.topFrame}>
        <FullCalendar
          height={'100%'}
          aspectRatio={1}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          weekends={true} // Display weekends
          events={events}
          eventContent={renderEventContent}
        />
      </div>
      <div className={styles.bottomFrame}></div>
    </div>
  );
};

export default StatsPage;

function renderEventContent(eventInfo: EventContentArg) {
  return (
    <>
      <b>{eventInfo.timeText}</b>
      <i>{eventInfo.event.title}</i>
    </>
  );
}
