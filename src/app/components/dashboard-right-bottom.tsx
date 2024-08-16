"use client";
import styles from './dashboard-right-bottom.module.css';
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
  Pagination,
  ScrollShadow
} from "@nextui-org/react";
import { LogSession, getSessions } from "../../../firebase";
import { onSnapshot, collection, Timestamp } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import {useAsyncList} from "@react-stately/data";



// Define the type for session logs
interface Session {
  id: string;
  startDate: string;  // Use string
  endDate: string;    // Use string
  type: string;
  length: string;     // Change to string for formatted length
  name?: string;      // Add name field
  description?: string; 

}

// Convert Firestore Timestamp to ISO string
const formatTimestamp = (timestamp: Timestamp | Date | undefined, excludeYear = false) => {
  if (!timestamp) return ''; // Return empty string if timestamp is undefined

  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    month: 'numeric',
    day: 'numeric',
    year: excludeYear ? undefined : '2-digit', // Use 2-digit year format when needed
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  };
  return date.toLocaleString('en-US', options);
};








const formatLength = (startDate: Date, endDate: Date | null) => {
  const end = endDate || new Date(); // Use current date if endDate is null
  const durationInSeconds = Math.floor((end.getTime() - startDate.getTime()) / 1000);

  if (durationInSeconds < 60) {
    return `${durationInSeconds}s`; // Format seconds
  }

  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};






interface LeftSideProps {
  onModalOpenChange: (isOpen: boolean) => void;
  onSessionSelect: (session: Session | null) => void;
}

const LeftSide: React.FC<LeftSideProps> = ({ onModalOpenChange, onSessionSelect }) => {


  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const handleRowAction = (key: React.Key) => {
    const session = sessions.find(s => s.id === key.toString());
    if (session) {
      setSelectedSession(session);
      setIsModalOpen(true);
      onSessionSelect(session); // Pass the selected session to the parent
      onModalOpenChange(true);  // Notify parent that modal is open
      console.log(`Selected session: ${JSON.stringify(session)}`);
    }
  };
  

// Function to format length
const formatLength = (startDate: Date, endDate: Date | null) => {
  const end = endDate || new Date(); // Use current date if endDate is null
  const durationInSeconds = Math.floor((end.getTime() - startDate.getTime()) / 1000);

  if (durationInSeconds < 60) {
    return `${durationInSeconds}s`; // Format seconds
  }

  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

// Update `useEffect` hook
useEffect(() => {
  const now = new Date(); // Current time for length calculation

  const fetchSessions = async () => {
    try {
      const sessionsData = await getSessions();
      if (sessionsData) {
        const sortedSessions: Session[] = sessionsData
          .map(session => {
            // Ensure correct type handling
            const startDate = session.startDate instanceof Timestamp ? session.startDate.toDate() : new Date(session.startDate);
            const endDate = session.endDate ? (session.endDate instanceof Timestamp ? session.endDate.toDate() : new Date(session.endDate)) : null;
            
            // Use `length` if endDate is present; otherwise use `formatLength`
            const length = endDate ? session.length : formatLength(startDate, endDate);
            
            return {
              ...session,
              startDate: formatTimestamp(startDate),
              endDate: endDate ? formatTimestamp(endDate, true) : '',
              length,
            };
          })
          .sort((a, b) => new Date(b.endDate || now).getTime() - new Date(a.endDate || now).getTime());
        
        setSessions(sortedSessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  fetchSessions();

  const unsubscribe = onSnapshot(collection(getFirestore(), "sessions"), (snapshot) => {
    const sessionsData = snapshot.docs.map(doc => {
      const data = doc.data();
      const startDate = data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate);
      const endDate = data.endDate ? (data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate)) : null;

      // Use `length` if endDate is present; otherwise use `formatLength`
      const length = endDate ? data.length : formatLength(startDate, endDate);

      return {
        id: doc.id,
        startDate: formatTimestamp(startDate),
        endDate: endDate ? formatTimestamp(endDate, true) : '',
        type: data.type,
        length,
        name: data.name || '',
        description: data.description || '',
      } as Session;
    });

    if (sessionsData) {
      const sortedSessions: Session[] = sessionsData
        .sort((a, b) => new Date(b.endDate || now).getTime() - new Date(a.endDate || now).getTime());
      setSessions(sortedSessions);
    }
  });

  return () => unsubscribe(); // Cleanup listener on component unmount
}, []);

  
  
  
  

  const columns = [
    { key: "date", label: "Date" },
    { key: "length", label: "Length" },
    { key: "name", label: "Name" },
  ];
  const rowsPerPage = 10;

  

  const [page, setPage] = React.useState(1);

  // Calculate the total number of pages
  const pages = Math.ceil(sessions.length / rowsPerPage);

  // Slice the sessions for the current page
  const paginatedSessions = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sessions.slice(start, end);
  }, [page, sessions]);




  return (
    <div className={styles.leftTopFrame}>
      <div className={styles.tableContainer}>
      <ScrollShadow className="w-[100%] h-[100%]" >
      <Table className={styles.table} onRowAction={handleRowAction} color="secondary" selectionMode="single" aria-label="Session logs" removeWrapper>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={paginatedSessions} emptyContent="No rows to display.">
            {(item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.endDate ? `${item.startDate} - ${item.endDate.split(', ')[1]}` : `${item.startDate} -`}
                </TableCell>
                <TableCell>{item.length}</TableCell>
                <TableCell>
                  {item.name && item.name.length > 60 ? `${item.name.slice(0, 60)}...` : item.name || ''}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </ScrollShadow>
        <div className="flex w-full justify-center absolute bottom-5 right-1">
          <Pagination
            isCompact
            showControls
            showShadow
            color="secondary"
            page={page}
            total={pages}
            onChange={(page) => setPage(page)}
          />
        </div>
      </div>
    </div>
  );
};

export default LeftSide;
