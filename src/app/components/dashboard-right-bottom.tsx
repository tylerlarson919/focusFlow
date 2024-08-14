"use client";
import styles from './dashboard-right-bottom.module.css';
import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
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
}

// Convert Firestore Timestamp to ISO string
const formatTimestamp = (timestamp: Timestamp, excludeYear = false) => {
  const date = timestamp.toDate();
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



const formatLength = (length: number) => {
  if (length < 60) {
    return `${length}s`; // Format seconds
  }
  const hours = Math.floor(length / 60);
  const minutes = length % 60;
  return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
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
  



  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionsData = await getSessions();
        if (sessionsData) {
          const sortedSessions: Session[] = sessionsData
          .map(session => ({
            ...session,
            startDate: formatTimestamp(session.startDate),  // Format Timestamp to string
            endDate: formatTimestamp(session.endDate, true), // Format Timestamp with the year excluded
            length: formatLength(session.length),            // Format length
          }))
          .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()); // Sort by string dates
        
          setSessions(sortedSessions);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };
    
    
    

    fetchSessions();

    // Set up real-time listener for new sessions
    const unsubscribe = onSnapshot(collection(getFirestore(), "sessions"), (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          startDate: formatTimestamp(data.startDate as Timestamp),  // Format Timestamp to string
          endDate: formatTimestamp(data.endDate as Timestamp),      // Format Timestamp to string
          type: data.type,
          length: formatLength(data.length),                        // Format length
          name: data.name || '',                                   // Add empty name
        } as Session;
      });
      if (sessionsData) {
        const sortedSessions: Session[] = sessionsData
          .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()); // Sort by string dates
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

  return (
    <div className={styles.leftTopFrame}>
      <div className={styles.tableContainer}>
        <Table onRowAction={handleRowAction} color="secondary" selectionMode="single" aria-label="Session logs" removeWrapper>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={sessions}>
            {(item) => (
              <TableRow key={item.id}>
                <TableCell>{`${item.startDate} - ${item.endDate.split(', ')[1]}`}</TableCell>
                <TableCell>{item.length}</TableCell>
                <TableCell>{item.name || ''}</TableCell>
              </TableRow>
            )}
          </TableBody>

        </Table>
      </div>
    </div>
  );
};

export default LeftSide;
