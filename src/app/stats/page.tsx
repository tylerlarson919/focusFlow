"use client"; // Ensure this file is rendered on the client side

import React from 'react';
import styles from './stats.module.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventContentArg } from '@fullcalendar/core';

const events = [
  { title: 'Meeting', start: new Date() }
];

const StatsPage: React.FC = () => {
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
          // Optionally add more FullCalendar props here
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
