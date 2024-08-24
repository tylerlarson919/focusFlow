'use client';

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import HeaderMain from "../components/header";
import { Button, ButtonGroup } from "@nextui-org/react";
import "./react-big-calendar.css";
import CustomToolbar from "./custom-toolbar";
import TaskModal from "../components/task-modal";
import { doc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebase.js';
import { color } from "framer-motion";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Task {
  id: string;
  startDate: string;
  endDate: string;
  date: string;
  type: string;
  length: string;
  name?: string;
  description?: string;
  color?: string;

}

interface MyEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  color?: string;
}

const MyCalendar = () => {
  const [view, setView] = useState<View>(Views.MONTH);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedSession, setSelectedSession] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch tasks from Firestore

  useEffect(() => {
    fetchTasks(); // Fetch tasks when component mounts
  }, []);

  
  const fetchTasks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => {
        const task = doc.data() as Task;
        return {
          title: task.name || "New Task",
          start: new Date(task.date),
          end: task.endDate ? new Date(task.endDate) : new Date(task.date),
          color: task.color || '#007bff',
          resource: task,
        };
      });
      setEvents(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  
  

  const OpenNewTaskModal = (isClicked: boolean, date: Date) => {
    if (isClicked) {
      const localDateString = date.toLocaleDateString('en-US');
      setSelectedTask(null);
      setSelectedDate(localDateString);
      setIsTaskModalOpen(true);
    }
  };

  const OpenEditTaskModal = (isClicked: boolean, task: any) => {
    if (isClicked) {
      setSelectedSession(null);
      setSelectedTask(task);
      setIsTaskModalOpen(true);
    }
  };

  const handleSelectEvent = (event: MyEvent) => {
    OpenEditTaskModal(true, event.resource);
  };


  
  const MonthEvent: React.FC<{ event: MyEvent }> = ({ event }) => (
    <div
      style={{ 
        backgroundColor: event.color || '#007bff',
        paddingTop: '0px',
        paddingBottom: '0px',
      }}
      className="rbc-event"
    >
      <div className="rbc-event-content">
        {event.title}
      </div>
    </div>
  );
  
  const WeekDayEvent: React.FC<{ event: MyEvent }> = ({ event }) => {
    const eventStyle = {
      backgroundColor: event.color || '#007bff', // Use the dynamic color
      padding: '0px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      color: 'white',
    };
  
    return (
      <div className="rbc-event" style={eventStyle}>
        <div className="rbc-event-content" style={{ padding: '2px 4px' }}>
          {event.title}
        </div>
      </div>
    );
  };
  
  
  
  const DayEvent: React.FC<{ event: MyEvent }> = ({ event }) => (
    <div
      style={{ 
        backgroundColor: event.color || '#007bff',
        paddingTop: '0px',
        paddingBottom: '0px',
      }}
      className="rbc-event rbc-event-day"
    >
      <div className="rbc-event-content">
        {event.title}
      </div>
    </div>
  );
  
  const AgendaEvent: React.FC<{ event: MyEvent }> = ({ event }) => (
    <div
      style={{ 
        backgroundColor: event.color || '#007bff',
        paddingTop: '0px',
        paddingBottom: '0px',
      }}
      className="rbc-event rbc-event-agenda"
    >
      <div className="rbc-event-content">
        {event.title}
      </div>
    </div>
  );
  
  const navigate = (direction: 'prev' | 'next') => {
    const updateDate = (date: Date) => {
      switch (view) {
        case Views.MONTH:
          return direction === 'next'
            ? new Date(date.setMonth(date.getMonth() + 1))
            : new Date(date.setMonth(date.getMonth() - 1));
        case Views.WEEK:
          return direction === 'next'
            ? new Date(date.setDate(date.getDate() + 7))
            : new Date(date.setDate(date.getDate() - 7));
        case Views.DAY:
          return direction === 'next'
            ? new Date(date.setDate(date.getDate() + 1))
            : new Date(date.setDate(date.getDate() - 1));
        case Views.AGENDA:
          return direction === 'next'
            ? new Date(date.setDate(date.getDate() + 1))
            : new Date(date.setDate(date.getDate() - 1));
        default:
          return date;
      }
    };
  
    setCurrentDate(updateDate(currentDate));
  };
  

  const handleViewChange = (newView: View) => {
    setView(newView);
  
    const resetDate = () => {
      const today = new Date();
      switch (newView) {
        case Views.MONTH:
          return new Date(today.getFullYear(), today.getMonth(), 1); // Start of the current month
        case Views.WEEK:
          return new Date(today.setDate(today.getDate() - today.getDay())); // Start of the current week
        case Views.DAY:
          return new Date(today.setHours(0, 0, 0, 0)); // Start of the current day
        case Views.AGENDA:
          return today; // Current day for agenda view
        default:
          return today;
      }
    };
  
    setCurrentDate(resetDate());
  };
  


  return (
    <div className="h-screen flex flex-col">
      <HeaderMain />
      <div className="flex items-center justify-between p-4">
        <div className="w-96"></div>
        <div className="flex justify-center items-center gap-6 flex-1 text-center">
          <Button variant="light" onClick={() => navigate('prev')}>&lt;</Button> {/* Left Arrow */}
          <h2 className="text-lg font-bold">
            {localizer.format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="light" onClick={() => navigate('next')}>&gt;</Button> {/* Right Arrow */}
        </div>
        
        <ButtonGroup className="w-96">
          <Button onClick={() => handleViewChange(Views.MONTH)}>Month</Button>
          <Button onClick={() => handleViewChange(Views.WEEK)}>Week</Button>
          <Button onClick={() => handleViewChange(Views.DAY)}>Day</Button>
          <Button onClick={() => handleViewChange(Views.AGENDA)}>Agenda</Button>
        </ButtonGroup>
      </div>

      <div className="flex-1">
      <Calendar
        key={events.length}
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={['month', 'week', 'day', 'agenda']}
        view={view}
        onView={(newView) => setView(newView)}
        date={currentDate} // Set the current date here
        components={{
          toolbar: CustomToolbar,
          event: (props) => {
            switch (view) {
              case Views.MONTH:
                return <MonthEvent {...props} />;
              case Views.WEEK:
                return <WeekDayEvent {...props} />; // Use the dynamic event component
              case Views.DAY:
                return <DayEvent {...props} />;
              case Views.AGENDA:
                return <AgendaEvent {...props} />;
              default:
                return <MonthEvent {...props} />;
            }
          },
        }}
        style={{ height: "100%" }}
        onSelectEvent={handleSelectEvent}
      />

      </div>
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => { 
          setIsTaskModalOpen(false);
          fetchTasks(); // Refresh tasks on modal close
        }}
        onNewTaskClick={OpenNewTaskModal}
        onSave={async () => { 
          await fetchTasks(); // Refresh tasks on save
        }}
        initialDate={selectedDate}
        task={selectedTask}
      />
    </div>
  );
};

export default MyCalendar;
