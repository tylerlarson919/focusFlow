"use client";

import React, { useState, useEffect } from 'react';
import styles from './calendar.module.css';
import { GoDash } from "react-icons/go";
import HeaderMain from '../components/header';


type Event = {
  id: number;
  title: string;
  subtitle: string;
  start: Date;
  end: Date;
  status: 'Available' | 'Busy';
};

const generateDummyEvents = (): Event[] => {
  const events: Event[] = [];
  for (let i = 0; i < 10; i++) {
    events.push({
      id: i,
      title: `Person ${i + 1}`,
      subtitle: `Meeting with team`,
      start: new Date(2024, 7, 19 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 24), 0),
      end: new Date(2024, 7, 19 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 24), 0),
      status: Math.random() > 0.5 ? 'Available' : 'Busy',
    });
  }
  return events;
};

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return `${hour}:00 ${ampm}`;
});

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [draggingEvent, setDraggingEvent] = useState<Event | null>(null);
  const [resizingEvent, setResizingEvent] = useState<{ event: Event, direction: 'top' | 'bottom' } | null>(null);

  useEffect(() => {
    setEvents(generateDummyEvents());
  }, []);

  const getDisplayedDates = () => {
    const startOfWeek = new Date(2024, 7, 19 + currentWeek * 7);
    const displayedDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      displayedDates.push({
        day: daysOfWeek[i],
        date: date.getDate(),
      });
    }
    return displayedDates;
  };

  const handleDragStart = (event: Event, e: React.DragEvent) => {
    e.stopPropagation();
    setDraggingEvent(event);
  };

  const handleDragEnd = () => {
    setDraggingEvent(null);
    setResizingEvent(null);
  };

  const handleDrop = (dayIndex: number, timeIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingEvent) return;

    const newEvents = events.map(ev => {
      if (ev.id === draggingEvent.id) {
        const newStart = new Date(2024, 7, 19 + dayIndex, timeIndex);
        const duration = (ev.end.getTime() - ev.start.getTime()) / (1000 * 60 * 60); // in hours
        const newEnd = new Date(newStart.getTime() + duration * 60 * 60 * 1000);

        return { ...ev, start: newStart, end: newEnd };
      }
      return ev;
    });

    // If holding the Alt key, duplicate the event
    if (e.altKey) {
      setEvents([...newEvents, { ...draggingEvent, id: events.length }]);
    } else {
      setEvents(newEvents);
    }

    setDraggingEvent(null);
  };

  const handleResizeStart = (event: Event, direction: 'top' | 'bottom', e: React.MouseEvent) => {
    e.stopPropagation();
    setResizingEvent({ event, direction });
  };

  const handleResize = (timeIndex: number, e: React.MouseEvent) => {
    if (!resizingEvent) return;

    const newEvents = events.map(ev => {
      if (ev.id === resizingEvent.event.id) {
        let newStart = ev.start;
        let newEnd = ev.end;

        if (resizingEvent.direction === 'top') {
          newStart = new Date(ev.start);
          newStart.setMinutes(0, 0, 0);
          newStart.setHours(timeIndex);
        } else if (resizingEvent.direction === 'bottom') {
          newEnd = new Date(ev.end);
          newEnd.setMinutes(0, 0, 0);
          newEnd.setHours(timeIndex + 1);
        }

        return { ...ev, start: newStart, end: newEnd };
      }
      return ev;
    });

    setEvents(newEvents);
  };

  return (
    <div className="">
      <HeaderMain />
        <div className={styles.container} onMouseUp={handleDragEnd}>
          <div className={styles.header}>
            <div className={styles.spacer}></div>
            <div className={styles.headerColumns}>
              {getDisplayedDates().map((day, index) => (
                <div key={index} className={styles.dayHeader}>
                  <span className={styles.dayText}>{day.day}</span>
                  <span className={styles.dateText}>{day.date}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.body}>
            <div className={styles.timeColumn}>
              {timeSlots.map((time, index) => (
                <div key={index} className={styles.timeSlotTime}>
                  <span className={styles.timeText}>{time}</span>
                  <div className={styles.lineIcons}>
                    <GoDash />
                    <GoDash />
                    <GoDash />
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.dayColumns}>
              {getDisplayedDates().map((_, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`${styles.dayColumn} ${styles.flexColumn}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(dayIndex, Math.floor(e.clientY / 110), e)}
                >
                  {timeSlots.map((_, timeIndex) => {
                    const eventForTime = events.find(event =>
                      new Date(event.start).getDate() === new Date(2024, 7, 19 + dayIndex).getDate() &&
                      new Date(event.start).getHours() === timeIndex
                    );

                    return (
                      <div key={timeIndex} className={styles.timeSlot}>
                        {eventForTime ? (
                          <div
                            className={`${styles.eventCard} ${eventForTime.status === 'Busy' ? styles.busy : styles.available}`}
                            draggable
                            onDragStart={(e) => handleDragStart(eventForTime, e)}
                            onDragEnd={handleDragEnd}
                            onMouseDown={(e) => {
                              if (e.shiftKey) {
                                handleResizeStart(eventForTime, 'bottom', e);
                              }
                            }}
                            onMouseMove={(e) => {
                              if (resizingEvent) {
                                handleResize(timeIndex, e);
                              }
                            }}
                          >
                            <span className={styles.eventTitle}>{eventForTime.title}</span>
                            <span className={styles.eventSubtitle}>{eventForTime.subtitle}</span>
                            <span className={styles.eventTime}>
                              {`${eventForTime.start.getHours()}:00 - ${eventForTime.end.getHours()}:00`}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default Calendar;
