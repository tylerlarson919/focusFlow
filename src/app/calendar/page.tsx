'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import HeaderMain from "../components/header";
import { Button, ButtonGroup, DropdownMenu, Dropdown, DropdownTrigger, DropdownItem } from "@nextui-org/react";
import "./react-big-calendar.css";
import CustomToolbar from "./custom-toolbar";
import TaskModal from "../components/task-modal";
import CustomDateCellWrapper from "./custom-date-cell";
import { doc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../../../firebase.js';
import { color } from "framer-motion";
import CalendarContainer from "./CalendarContainer"; // Adjust the path as needed
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';


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
  [key: string]: any;
}

const MyCalendar = () => {
  const [view, setView] = useState<View>(Views.MONTH);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedSession, setSelectedSession] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysShown, setDaysShown] = useState(7); // Default is 7 for desktop
  const DragAndDropCalendar = withDragAndDrop(Calendar);

  // Fetch tasks from Firestore

  useEffect(() => {
    fetchTasks(); // Fetch tasks when component mounts
  }, []);


  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) { // 768px is a common mobile breakpoint
        setDaysShown(3); // Show 3 days on mobile
      } else {
        setDaysShown(7); // Show 7 days on desktop
      }
    };
  
    window.addEventListener('resize', handleResize);
    handleResize(); // Call initially to set the correct value on load
  
    return () => window.removeEventListener('resize', handleResize);
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
          color: task.color || 'var(--blue)',
          resource: task,
        };
      });
      setEvents(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  
  const moveEvent = useCallback(
    async ({ event, start, end, isAllDay: droppedOnAllDaySlot = false }: { event: MyEvent, start: Date, end: Date, isAllDay?: boolean }) => {
      const updatedEvent = {
        ...event,
        start,
        end,
        allDay: droppedOnAllDaySlot,
      };
  
      try {
        // Update Firestore with new dates
        await updateDoc(doc(db, 'tasks', event.resource.id), {
          date: start.toISOString(),
          endDate: end.toISOString(),
        });
  
        // Update the event in the state
        setEvents((prevEvents) =>
          prevEvents.map((ev) => (ev.resource.id === event.resource.id ? updatedEvent : ev))
        );
  
        // Optionally, open the Task Modal with the updated task
        setSelectedTask(updatedEvent.resource);
        setIsTaskModalOpen(true);
  
      } catch (error) {
        console.error('Error updating event:', error);
      }
    },
    [setEvents]
  );
  
  const resizeEvent = useCallback(
    async ({ event, start, end }: { event: MyEvent, start: Date, end: Date }) => {
      const updatedEvent = {
        ...event,
        start,
        end,
      };
  
      // Update Firestore with new dates
      await updateDoc(doc(db, 'tasks', event.resource.id), {
        date: start.toISOString(),
        endDate: end.toISOString(),
      });
  
      // Update the event in the state
      setEvents((prevEvents) =>
        prevEvents.map((ev) => (ev.resource.id === event.resource.id ? updatedEvent : ev))
      );
    },
    [setEvents]
  );

  const OpenNewTaskModal = (date: Date) => {
    const localDateString = date.toLocaleDateString('en-US');
    setSelectedTask(null);
    setSelectedDate(localDateString);
    setIsTaskModalOpen(true);
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
        backgroundColor: event.color || 'var(--blue)', // Dynamically set color
        paddingTop: '0px',
        paddingBottom: '0px',
        fontSize: '12px',
        position: 'relative',
        zIndex: 1000, // Set high z-index
      }}
      className="rbc-event"
    >
      <div className="rbc-event-content" style={{ zIndex: 1000 }}>
        {event.title}
      </div>
    </div>
  );
  
  
  
  const WeekDayEvent: React.FC<{ event: MyEvent }> = ({ event }) => {
    // Inline style to apply to existing rbc-event class
    const eventStyle = {
      backgroundColor: event.color || 'var(--blue)' + ' !important',
      paddingTop: '3px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      color: 'white',
      whiteSpace: 'nowrap',
    };
  
    return (
      <div className="rbc-event-content" style={eventStyle}>
        <div className="rbc-event-content">
          {event.title}
        </div>
      </div>
    );
  };
  
  
  
  
  const DayEvent: React.FC<{ event: MyEvent }> = ({ event }) => (
    <div
      style={{ 
        backgroundColor: event.color || 'var(--blue)',
        paddingTop: '4px',
        marginBottom: '40px',
      }}
      className="rbc-event rbc-event-day rbc-event-content"
    >
      <div className="rbc-event-content">
        {event.title}
      </div>
    </div>
  );
  
  const AgendaEvent: React.FC<{ event: MyEvent }> = ({ event }) => (
    <div
      style={{ 
        backgroundColor: event.color || 'var(--blue)',
        paddingTop: '0px',
        paddingBottom: '0px',
      }}
      className="rbc-event rbc-event-agenda rbc-event-content"
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
      <div className="justify-center items-center p-2 flex-col-reverse flex sm:flex-row sm:flex sm:items-center sm:justify-between sm:p-4">
        <div className="w-24"></div>
        <div className="flex justify-center items-center gap-6 flex-1 text-center">
          <Button variant="light" onClick={() => navigate('prev')}>&lt;</Button>
          <h2 className="text-lg font-bold">
            {view === Views.MONTH && localizer.format(currentDate, "MMMM yyyy")}
            {view === Views.WEEK && `Week of ${localizer.format(currentDate, "MMM d, yyyy")}`}
            {(view === Views.DAY || view === Views.AGENDA) && localizer.format(currentDate, "MMM d, yyyy")}
          </h2>
          <Button variant="light" onClick={() => navigate('next')}>&gt;</Button>
        </div>
        <div className="w-24 flex justify-center">
        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat">
              {view.charAt(0).toUpperCase() + view.slice(1).toLowerCase()}
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Select View" 
            onAction={(key) => handleViewChange(key as View)}
          >
            <DropdownItem key={Views.MONTH}>Month</DropdownItem>
            <DropdownItem key={Views.WEEK}>Week</DropdownItem>
            <DropdownItem key={Views.DAY}>Day</DropdownItem>
            <DropdownItem key={Views.AGENDA}>Agenda</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        </div>
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
          dateCellWrapper: (props) => (
            <CalendarContainer {...props} onAddTask={OpenNewTaskModal} />
          ),

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
        onNewTaskClick={() => {}} 
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
