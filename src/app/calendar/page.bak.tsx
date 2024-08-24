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
    const start = new Date(2024, 7, 19 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 24), 0);
    const end = new Date(start.getTime() + Math.floor(Math.random() * 120) * 60000); // End is within 2 hours after start

    events.push({
      id: i,
      title: `Person ${i + 1}`,
      subtitle: `Meeting with team`,
      start,
      end,
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
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);


  useEffect(() => {
    setEvents(generateDummyEvents());
  }, []);


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingEvent) {
        // Calculate the timeIndex based on mouse position
        const timeIndex = Math.floor(e.clientY / 110); // Adjust calculation as needed
        handleResize(timeIndex, e as unknown as React.MouseEvent); // Cast e to React.MouseEvent if necessary
      }
    };
  
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [resizingEvent]);
  
  

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

  // Calculate the height of an event card based on its duration
  const getEventCardHeight = (start: Date, end: Date): number => {
    // Ensure end date is not before start date
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // If the event spans multiple days, we will calculate the height by splitting it into daily segments
    let durationInMinutes = 0;
  
    // Calculate total duration in minutes considering multi-day events
    while (startDate < endDate) {
      const nextMidnight = new Date(startDate);
      nextMidnight.setHours(23, 59, 59, 999);
      const segmentEnd = new Date(Math.min(endDate.getTime(), nextMidnight.getTime()));
  
      durationInMinutes += (segmentEnd.getTime() - startDate.getTime()) / (1000 * 60);
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);
    }
    
    const minHeight = 200 / 12; // Height for 5 minutes
    const height = Math.max(minHeight, (durationInMinutes * minHeight) / 5);
    
    // Round down to nearest pixel
    const roundedHeight = Math.floor(height);
    
    return roundedHeight;
  };
  
  
  



  const handleDragStart = (event: Event, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingEvent(event);
  
    console.log('Drag started:', event);
  
    e.dataTransfer.setData('text/plain', JSON.stringify(event));
  
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      console.log('Mouse position:', { x: e.clientX, y: e.clientY });
    };
  
    const handleDragEnd = (e: MouseEvent) => {
      console.log('Drag ended');
      setDraggingEvent(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  
  
  
  

  const handleDragEnd = () => {
    setDraggingEvent(null);
    setResizingEvent(null);
  };

  const handleDrop = (dayIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingEvent || !mousePosition) return;
  
    console.log('Drop position:', { x: mousePosition.x, y: mousePosition.y });
  
    const timeIndex = Math.round(mousePosition.y / 110); // Adjust this divisor as needed
    const newStart = new Date(2024, 7, 19 + dayIndex, timeIndex);
    const duration = (draggingEvent.end.getTime() - draggingEvent.start.getTime()) / (1000 * 60 * 60); // in hours
    const newEnd = new Date(newStart.getTime() + duration * 60 * 60 * 1000);
  
    console.log('New start time:', newStart);
    console.log('New end time:', newEnd);
  
    const newEvents = events.map(ev => {
      if (ev.id === draggingEvent.id) {
        return { ...ev, start: newStart, end: newEnd };
      }
      return ev;
    });
  
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
  
    const snappedTimeIndex = Math.round(timeIndex);
    const newEvents = events.map(ev => {
      if (ev.id === resizingEvent.event.id) {
        let newStart = ev.start;
        let newEnd = ev.end;
  
        if (resizingEvent.direction === 'top') {
          newStart = new Date(ev.start);
          newStart.setMinutes(0, 0, 0);
          newStart.setHours(snappedTimeIndex);
        } else if (resizingEvent.direction === 'bottom') {
          newEnd = new Date(ev.end);
          newEnd.setMinutes(0, 0, 0);
          newEnd.setHours(snappedTimeIndex + 1);
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
                  onDrop={(e) => handleDrop(dayIndex, e)}
                >
                  {timeSlots.map((_, timeIndex) => {
                    const eventForTime = events.find(event =>
                      new Date(event.start).getDate() === new Date(2024, 7, 19 + dayIndex).getDate() &&
                      new Date(event.start).getHours() === timeIndex
                    );

                    return (
                      <div
                        key={timeIndex}
                        className={styles.timeSlot}
                        onMouseMove={(e) => {
                          if (resizingEvent) {
                            handleResize(timeIndex, e);
                          }
                        }}
                      >
                        {eventForTime ? (
                          <div
                            className={`${styles.eventCard} ${eventForTime.status === 'Busy' ? styles.busy : styles.available}`}
                            style={{ height: getEventCardHeight(eventForTime.start, eventForTime.end) }}
                            draggable
                            onDragStart={(e) => handleDragStart(eventForTime, e)}
                            onDragEnd={handleDragEnd}
                            onMouseDown={(e) => {
                              if (e.shiftKey) {
                                handleResizeStart(eventForTime, 'bottom', e);
                              }
                            }}
                          >

                            <span className={styles.eventTitle}>{eventForTime.title}</span>
                            <span className={styles.eventSubtitle}>{eventForTime.subtitle}</span>
                            <span className={styles.eventTime}>
                              {`${eventForTime.start.getHours() % 12 || 12}:${eventForTime.start.getMinutes().toString().padStart(2, '0')} ${eventForTime.start.getHours() < 12 ? 'AM' : 'PM'} - ${eventForTime.end.getHours() % 12 || 12}:${eventForTime.end.getMinutes().toString().padStart(2, '0')} ${eventForTime.end.getHours() < 12 ? 'AM' : 'PM'}`}
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



// So something is messed up with the drag function, The only place the user should see it being dragged is as it's being updated in real time, and then when the drag ends it should just leave it where the last time block was where the event was being dragged. So it's recognizing drag start, the mouse position in between, and when the drag ends but it's not actually updating the event. 