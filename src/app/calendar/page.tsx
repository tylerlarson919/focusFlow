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

  // Fetch tasks from Firestore
  useEffect(() => {
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

    fetchTasks();
  }, []);
  

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

  const handleSave = async () => {
    if (selectedTask) {
      try {
        const taskRef = doc(db, 'tasks', selectedTask.id);
        await updateDoc(taskRef, {
          name: selectedTask.name || '',
          description: selectedTask.description || '',
        });
        console.log('Task updated successfully');
  
        // Fetch tasks again after updating
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
        console.error('Error updating task:', error);
      }
    }
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
  
  const WeekDayEvent: React.FC<{ event: MyEvent }> = ({ event }) => (
    <div
      className="rbc-event"
      style={{ 
        backgroundColor: event.color || '#007bff',
        padding: '0px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px'
      }}
    >
      <div 
        className="rbc-event-content"
        style={{ 
          color: 'white',
          padding: '2px 4px',
        }}
      >
        {event.title}
      </div>
    </div>
  );
  
  
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
  
  


  return (
    <div className="h-screen flex flex-col">
      <HeaderMain />
      <div className="flex items-center justify-between p-4">
        <div className="w-96"></div>
        <div className="flex-1 text-center">
          <h2 className="text-lg font-bold">
            {localizer.format(new Date(), "MMMM yyyy")}
          </h2>
        </div>
        <ButtonGroup className="w-96">
          <Button onClick={() => setView(Views.MONTH)}>Month</Button>
          <Button onClick={() => setView(Views.WEEK)}>Week</Button>
          <Button onClick={() => setView(Views.DAY)}>Day</Button>
          <Button onClick={() => setView(Views.AGENDA)}>Agenda</Button>
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
        components={{
          toolbar: CustomToolbar,
          event: (props) => {
            switch (view) {
              case Views.MONTH:
                return <MonthEvent {...props} />;
              case Views.WEEK:
                return <WeekDayEvent {...props} />;
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
        onClose={() => setIsTaskModalOpen(false)}
        onNewTaskClick={OpenNewTaskModal}
        onSave={handleSave}
        initialDate={selectedDate}
        task={selectedTask}
      />
    </div>
  );
};

export default MyCalendar;
