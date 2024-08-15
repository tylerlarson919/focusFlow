"use client";
import React, { useState } from 'react';
import styles from './page.module.css';
import LeftTop from './components/dashboard-left-top';
import LeftBottom from './components/dashboard-left-bottom';
import RightTop from './components/dashboard-right-top';
import RightBottom from './components/dashboard-right-bottom';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Input, select, Textarea } from "@nextui-org/react";
import { FaCalendar, FaClock, FaEdit, FaRegStickyNote, FaTrash } from "react-icons/fa";
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { db } from '../../firebase.js';
import TaskModal from './components/task-modal';



// Define the type for session logs
interface Session {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  length: string;
  name?: string;
  description?: string; 
}




const Page: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);



  // Handle session selection
  const handleSessionSelect = (session: Session | null) => {
    setSelectedSession(session); // Set the selected session
    setSelectedTask(null); // Clear any selected task to avoid conflicts
    onOpen(); // Open the modal when a session is selected
};

const OpenNewTaskModal = (isClicked: boolean, date: Date) => {
  if (isClicked) {
      const localDateString = date.toLocaleDateString('en-US'); // Format to local date string
      setSelectedTask(null); // Clear any previously selected task
      setSelectedDate(localDateString); // Set the formatted date
      setIsTaskModalOpen(true); // Open the modal
      console.log('Sending Date: ' + localDateString);
  }
};
const OpenEditTaskModal = (isClicked: boolean, task: any) => {
  if (isClicked) {
      setSelectedSession(null); // Clear any selected session to avoid conflicts
      setSelectedTask(task); // Set the task to be edited
      setIsTaskModalOpen(true); // Open the modal
  }
};
  


  return (
    <div className={styles.container}>
      <div className={styles.leftFrame}>
      <LeftTop
        onNewTaskClick={OpenNewTaskModal}
        onEditTaskClick={OpenEditTaskModal}  // New prop for editing tasks
        tasks={tasks} // Ensure tasks is provided
        setTasks={setTasks} // Ensure setTasks is provided
      />
        <LeftBottom />
      </div>
      <div className={styles.rightFrame}>
        <RightTop />
        <RightBottom 
          onModalOpenChange={onOpenChange} 
          onSessionSelect={handleSessionSelect} 
        />
      </div>
      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)}
        onNewTaskClick={OpenNewTaskModal}  
        onSave={() => {}}  
        initialDate={selectedDate}  // Pass the date as a string
        task={selectedTask}   // Add this line to pass the selected session
      />

      <Modal size="4xl" isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => {
          const handleSave = async () => {
            if (selectedSession) {
              try {
                const firestore = getFirestore();
                const sessionRef = doc(db, 'sessions', selectedSession.id);
                await updateDoc(sessionRef, {
                  name: selectedSession.name || '',
                  description: selectedSession.description || '',
                });
                onClose();  // Close the modal after saving
                console.log('Session updated successfully with data: ' + selectedSession.name + selectedSession.description);
              } catch (error) {
                console.error('Error updating session:', error);
              }
            }
          };
          return (
            <>
              <ModalHeader className="items-center flex flex-row gap-3 text-3xl">
              <FaTrash
                className="text-2xl text-red-500 cursor-pointer"
                onClick={async () => {
                  if (selectedSession) {
                    try {
                      const firestore = getFirestore();
                      const sessionRef = doc(db, 'sessions', selectedSession.id);
                      await deleteDoc(sessionRef);  // Function to delete the document
                      onClose();  // Close the modal after deleting
                      console.log('Session deleted successfully');
                    } catch (error) {
                      console.error('Error deleting session:', error);
                    }
                  }
                }}
              /> 
                <span>Session Details</span>
                </ModalHeader>
              <ModalBody>
                {selectedSession ? (
                  <div>
                    <Input
                      className={styles.paddingBottom}
                      radius="md" 
                      size="md" 
                      type="name" 
                      label="Name" 
                      onValueChange={(value) => setSelectedSession({ ...selectedSession, name: value })}
                      defaultValue={selectedSession?.name || ''}
                      placeholder="Enter Name"
                      labelPlacement="outside"
                      startContent={
                        <FaEdit className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                      }
                      />
                    <Textarea
                      className={styles.paddingBottom}
                      radius="md" 
                      size="md" 
                      type="description" 
                      label="Description" 
                      onValueChange={(value) => setSelectedSession({ ...selectedSession, description: value })}
                      defaultValue={selectedSession?.description || ''}
                      placeholder="Enter Description"
                      labelPlacement="outside"
                      startContent={
                        <FaRegStickyNote className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                      }
                      />
                    <Input 
                      className={styles.paddingBottom}
                      radius="md" 
                      isReadOnly 
                      size="md" 
                      type="startDate" 
                      label="Start Date" 
                      defaultValue={selectedSession.startDate}
                      labelPlacement="outside"
                      startContent={
                        <FaCalendar className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                      }
                      />
                    <Input
                      className={styles.paddingBottom}
                      radius="md" 
                      isReadOnly 
                      size="md" 
                      type="endDate" 
                      label="End Date" 
                      defaultValue={selectedSession.endDate}
                      labelPlacement="outside"
                      startContent={
                        <FaCalendar className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                      }
                      />
                    <Input 
                      className={styles.paddingBottom}
                      radius="md" 
                      isReadOnly 
                      size="md" 
                      type="length" 
                      label="Length" 
                      defaultValue={selectedSession.length}
                      labelPlacement="outside"
                      startContent={
                        <FaClock className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                      }
                      />
                    <p><strong>Type:</strong> {selectedSession.type}</p>
                  </div>
                ) : (
                  <p>No session selected</p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="secondary" onPress={handleSave}>
                  Save
                </Button>
              </ModalFooter>
            </>
          );
        }}
      </ModalContent>
      </Modal>
    </div>
  );
};

export default Page;





// 2. Timer is completely fucked and Does not log the end time when the timer ends. Also, the plant growth stages are messed up as well and are not changing. 
// 3. There should be a button on the left top to go to the schedule page, the schedule page will be a page where you can schedule for any day and see weekly or monthly overviews and how you're doing keeping up with the tasks, based off of the sessions logged
// 4. On the bottom part of the left side of the page, should be a calendar widget. Just a super simple calendar widget with marks on the dates that time was logged for, when you click on a date it will open a pop up with a table containing all the logs from that date and the total time logged, and maybe some other stats too.

// Features for later:
    // - Option to listen to combing sounds as the timer is playing, and also the option to choose which sounds
    // - Option to choose an alarm, saving the alarm preference to the fire store database for that user
    // - A stats page containing stats like average time per day, longest session, total hours logged etc.