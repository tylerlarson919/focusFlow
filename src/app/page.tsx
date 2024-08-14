"use client";
import React, { useState } from 'react';
import styles from './page.module.css';
import LeftTop from './components/dashboard-left-top';
import LeftBottom from './components/dashboard-left-bottom';
import RightTop from './components/dashboard-right-top';
import RightBottom from './components/dashboard-right-bottom';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Input } from "@nextui-org/react";
import { FaCalendar, FaClock, FaEdit  } from "react-icons/fa";
import { doc, updateDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';


// Define the type for session logs
interface Session {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  length: string;
  name?: string;
}





const Page: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Handle session selection
  const handleSessionSelect = (session: Session | null) => {
    setSelectedSession(session);
    onOpen();  // Open the modal when a session is selected
  };


  const handleSave = async () => {
    if (selectedSession) {
      try {
        const firestore = getFirestore();
        const sessionRef = doc(firestore, 'sessions', selectedSession.id);
        await updateDoc(sessionRef, {
          name: selectedSession.name,
        });
      } catch (error) {
        console.error('Error updating document:', error);
      }
    }
  };
  



  

  return (
    <div className={styles.container}>
      <div className={styles.leftFrame}>
        <LeftTop />
        <LeftBottom />
      </div>
      <div className={styles.rightFrame}>
        <RightTop />
        <RightBottom 
          onModalOpenChange={onOpenChange} 
          onSessionSelect={handleSessionSelect} 
        />
      </div>

      {/* Modal for displaying session details */}
      <Modal size="4xl" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Session Details</ModalHeader>
              <ModalBody>
                {selectedSession ? (
                  <div>
                    <Input
                      className={styles.paddingBottom}
                      radius="md" 
                      size="md" 
                      type="name" 
                      label="Name" 
                      defaultValue={selectedSession.name}
                      placeholder="Enter Name"
                      labelPlacement="outside"
                      startContent={
                        <FaEdit className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
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
                    {selectedSession.name && <p><strong>Name:</strong> {selectedSession.name}</p>}
                  </div>
                ) : (
                  <p>No session selected</p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={handleSave}>
                  Save
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Page;





// 1. First, add a next UI table element in the bottom frame
// 2. add logic To the table so that it shows a max of like 10 rows with the load more button. There should also be a hover effect and the name field should be editable 
// 3.  On the left side of the page, the top part should be another table for my schedule,Schedule properties include:
    // - Date (date and time)
    // - name
    // - Description
    // - Importance
// 4. On the bottom part of the left side of the page, should be a calendar widget. Just a super simple calendar widget with marks on the dates that time was logged for, when you click on a date it will open a pop up with a table containing all the logs from that date and the total time logged, and maybe some other stats too.

// Features for later:
    // - Option to listen to combing sounds as the timer is playing, and also the option to choose which sounds
    // - Option to choose an alarm, saving the alarm preference to the fire store database for that user
    // - A stats page containing stats like average time per day, longest session, total hours logged etc.