import React, { useState, useEffect, useRef } from 'react';
import { ScrollShadow, Calendar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, ButtonGroup, Table, TableBody, TableHeader, TableColumn, TableRow, TableCell } from '@nextui-org/react';
import { CalendarDate } from '@internationalized/date'; 
import styles from './dashboard-left-top.module.css';
import { getTasks, db } from '../../../firebase';
import { doc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { getAuth } from 'firebase/auth'; // Import Firebase Auth

interface LeftTopProps {
  onNewTaskClick: (isClicked: boolean, date: Date) => void;
  onEditTaskClick: (isClicked: boolean, task: any) => void;
  tasks: any[];
  setTasks: React.Dispatch<React.SetStateAction<any[]>>;
}

const LeftTop: React.FC<LeftTopProps> = ({ onNewTaskClick, onEditTaskClick, tasks, setTasks }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarVisible, setCalendarVisible] = useState<boolean>(false);
  const [calendarPosition, setCalendarPosition] = useState<{top: number, left: number} | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<Record<string, string>>({});

  const auth = getAuth(); // Initialize Firebase Auth
  const userId = auth.currentUser ? auth.currentUser.uid : null; // Get current user ID

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!userId) return; // Ensure user is logged in

    try {
      const taskDoc = doc(db, "tasks", id);
      const taskData = (await getDoc(taskDoc)).data();

      if (taskData && taskData.userId === userId) {
        await updateDoc(taskDoc, { status: newStatus });
        setTasks(prevTasks => prevTasks.map(task =>
          task.id === id ? { ...task, status: newStatus } : task
        ));
        setDropdownVisible(null);  // Close dropdown after status change
      } else {
        console.error("Unauthorized attempt to update task");
      }
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleDropdownToggle = (id: string) => {
    setDropdownVisible(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!userId) return; // Exit if no user is logged in

    const tasksCollection = collection(db, 'tasks');
    const userTasksQuery = query(tasksCollection, where("userId", "==", userId));

    const unsubscribe = onSnapshot(userTasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksData || []);
    });

    return () => unsubscribe(); // Clean up the listener on unmount
  }, [setTasks, userId]);

  useEffect(() => {
    setSelectedDate(currentDate);
  }, [currentDate]);

  const filteredAndSortedTasks = selectedDate ? (() => {
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    return tasks
      .filter(task => {
        const taskDate = new Date(task.date);
        return taskDate >= startOfDay && taskDate <= endOfDay;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })() : [];

  const handleRowAction = (key: React.Key) => {
    const selectedTask = tasks.find(task => task.id === key.toString());
    if (selectedTask) {
      // Call the edit task function
      onEditTaskClick(true, selectedTask);
    }
  };

  const handlePrevDay = () => {
    setCurrentDate(prevDate => new Date(prevDate.setDate(prevDate.getDate() - 1)));
  };

  const handleNextDay = () => {
    setCurrentDate(prevDate => new Date(prevDate.setDate(prevDate.getDate() + 1)));
  };

  const handleDateClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    const { clientX, clientY } = event;
    setCalendarPosition({ top: clientY + 20, left: clientX - 130 });
    setCalendarVisible(true);
  };

  const handleCalendarChange = (value: CalendarDate | null) => {
    if (value) {
      const newDate = new Date(value.year, value.month - 1, value.day);
      setCurrentDate(newDate);
      setSelectedDate(newDate);
    }
    setCalendarVisible(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const convertToDateValue = (date: Date): CalendarDate => {
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.leftTopFrame}>
      <div className={styles.paginationContainer}>
        <button className={styles.arrowButton} onClick={handlePrevDay}>
          {"<"}
        </button>
        <span className={`${styles.dateDisplay} font-semibold`} onClick={handleDateClick}>
          {formatDate(currentDate)}
        </span>
        <button className={styles.arrowButton} onClick={handleNextDay}>
          {">"}
        </button>

        {calendarVisible && calendarPosition && (
          <div className={styles.calendarOverlay}>
            <div 
              className={styles.calendarContainer} 
              ref={calendarRef}
              style={{ top: calendarPosition.top, left: calendarPosition.left }}
            >
              <Calendar 
                aria-label="Select Date" 
                value={convertToDateValue(selectedDate || currentDate)}
                onChange={handleCalendarChange}
                topContent={
                  <ButtonGroup
                    fullWidth
                    className="px-3 pb-2 pt-3 bg-content1 [&>button]:text-default-500 [&>button]:border-default-200/60"
                    radius="full"
                    size="sm"
                    variant="bordered"
                  >
                    <Button onPress={() => {
                      const todayDate = new Date();
                      setSelectedDate(todayDate);
                      setCurrentDate(todayDate);
                      setCalendarVisible(false);
                    }}>
                      Today
                    </Button>
                  </ButtonGroup>
                }
              />
            </div>
          </div>
        )}
      </div>
      <div className={styles.buttonsGroup}>
        <Button className="flex justify-center items-center" size="md" onClick={() => {
          const now = new Date();
          const isToday = currentDate.toDateString() === now.toDateString();
          const dateToSend = new Date(currentDate);

          if (isToday) {
            dateToSend.setHours(now.getHours(), now.getMinutes(), 0, 0);
          } else {
            dateToSend.setHours(0, 0, 0, 0); // Remove time component for non-today dates
          }

          onNewTaskClick(true, dateToSend);
          console.log("Date to send: ", dateToSend);
        }}>New Task</Button>
      </div>
      <ScrollShadow className="w-[100%] h-[400px]" hideScrollBar>
        <Table className={styles.table}
          color="secondary"
          selectionMode="single"
          aria-label="Task logs"
          removeWrapper
          onRowAction={handleRowAction}
        >
          <TableHeader columns={[
            { key: 'name', label: 'Name' },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status' },
            { key: 'importance', label: 'Importance' }
          ]}>
            {(column) => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={filteredAndSortedTasks} emptyContent="No tasks to display">
            {(item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{format(new Date(item.date), 'P')}</TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button onPress={() => handleDropdownToggle(item.id)}>
                        {item.status}
                      </Button>
                    </DropdownTrigger>
                    {dropdownVisible === item.id && (
                      <DropdownMenu>
                        {['Open', 'In Progress', 'Completed'].map(status => (
                          <DropdownItem key={status} onClick={() => handleStatusChange(item.id, status)}>
                            {status}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    )}
                  </Dropdown>
                </TableCell>
                <TableCell>{item.importance}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollShadow>
    </div>
  );
};

export default LeftTop;
