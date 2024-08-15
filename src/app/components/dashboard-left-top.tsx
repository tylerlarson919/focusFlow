import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Pagination, Button, ButtonGroup, Table, TableBody, TableHeader, TableColumn, TableRow, TableCell } from '@nextui-org/react';
import { CalendarDate } from '@internationalized/date'; 
import styles from './dashboard-left-top.module.css';
import { getTasks, db } from '../../../firebase';
import { doc, updateDoc, deleteDoc, onSnapshot, collection  } from 'firebase/firestore';
import { format } from 'date-fns';



interface LeftTopProps {
  onNewTaskClick: (isClicked: boolean, date: Date) => void; // Update this line
}

const LeftTop: React.FC<LeftTopProps> = ({ onNewTaskClick }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarVisible, setCalendarVisible] = useState<boolean>(false);
  const [calendarPosition, setCalendarPosition] = useState<{top: number, left: number} | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);


  const [tasks, setTasks] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [tasksPerPage] = useState<number>(10);

  const [dropdownVisible, setDropdownVisible] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<Record<string, string>>({});
  



  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "tasks", id), { status: newStatus });
      // Update the status in the state to reflect the change
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === id ? { ...task, status: newStatus } : task
      ));
      setDropdownVisible(null);  // Close dropdown after status change
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };
  
  
  const handleDropdownToggle = (id: string) => {
    setDropdownVisible(prev => (prev === id ? null : id));
  };
  

  useEffect(() => {
    const tasksCollection = collection(db, 'tasks');
  
    const unsubscribe = onSnapshot(tasksCollection, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksData || []);
    });
  
    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);
  

  useEffect(() => {
    setSelectedDate(currentDate);
  }, [currentDate]);

// Ensure selectedDate is not null before proceeding
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

// Pagination
const indexOfLastTask = page * tasksPerPage;
const indexOfFirstTask = indexOfLastTask - tasksPerPage;
const paginatedTasks = filteredAndSortedTasks.slice(indexOfFirstTask, indexOfLastTask);
const totalPages = Math.ceil(filteredAndSortedTasks.length / tasksPerPage);




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
        <span className={styles.dateDisplay} onClick={handleDateClick}>
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
      <Button className="flex justify-center items-center" size="md" onClick={() => {
        onNewTaskClick(true, currentDate); 
      }}>New Task</Button>
      <Table color="secondary" selectionMode="single" aria-label="Task logs" removeWrapper>
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
        <TableBody items={paginatedTasks} emptyContent="No tasks to display.">
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{format(item.date, "h:mm a")}</TableCell>
              <TableCell>
                <Dropdown
                  trigger="press"
                  onOpenChange={(isOpen) => {
                    if (!isOpen) setDropdownVisible(null);
                  }}
                >
                  <DropdownTrigger>
                    <Button
                      size="sm"
                      onClick={() => handleDropdownToggle(item.id)}
                      style={{ color: 'white' }} // Remove dynamic background color for now
                    >
                      {currentStatus[item.id] || item.status}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    selectionMode="single"
                    closeOnSelect={true}
                    aria-label="Select Status"
                  >
                    {["Not Started", "In Progress", "Completed"].map(status => (
                      <DropdownItem
                        key={status}
                        onPress={() => handleStatusChange(item.id, status)}
                      >
                        {status}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </TableCell>


              <TableCell>{item.importance}</TableCell>
            </TableRow>
          )}
        </TableBody>

      </Table>

      <div className="flex w-full justify-center bottom-4 absolute right-1">
        <Pagination
          isCompact
          showControls
          showShadow
          color="secondary"
          page={page}
          total={totalPages}
          onChange={(newPage) => setPage(newPage)}
        />
      </div>
    </div>

  );
};

export default LeftTop;


