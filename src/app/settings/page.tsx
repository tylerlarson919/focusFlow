// SettingsPage.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@nextui-org/table";
import { Button, Textarea, Select, SelectItem } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { getFirestore, getDocs, addDoc, doc, updateDoc, collection, deleteDoc } from "firebase/firestore";
import { app } from "../../../firebase"; // Assuming firebase.js is in the same folder
import styles from './page.module.css';
import { FaTrash } from "react-icons/fa";
import HeaderMain from '../components/header';
import { v4 as uuidv4 } from 'uuid'; // Import UUID library for generating unique IDs
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { size } from "lodash";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const db = getFirestore(app);

interface Habit {
  id: string;
  name: string;
  color: string;
  emoji: string;
  frequency: string;
  days_of_week: string[];
  userId?: string; // Make it optional if not all habits will have it
}



const SettingsPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]); // Use the Habit interface
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const mainDocRef = doc(db, "habits", "main");
  const habitsRefrenceCollection = collection(mainDocRef, "habits_refrence");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const emojiPickerRef = useRef(null); // Ref to handle hover outside

  const [userId, setUserId] = useState<string | null>(null);
  const auth = getAuth();

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
              setUserId(user.uid);
          } else {
              setUserId(null);
          }
      });

      return () => unsubscribe();
  }, [auth]);



  

  const fetchHabits = async () => {
    try {
      const habitDocs = await getDocs(habitsRefrenceCollection);
      const fetchedHabits = habitDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Habit[]; // Cast to the Habit interface
  
      const filteredHabits = fetchedHabits.filter(habit => habit.userId === userId); // Now it recognizes userId
      console.log("Fetched habits:", filteredHabits);
      setHabits(filteredHabits);
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };
  
  

  const handleRowClick = (habit: any) => {
    setSelectedHabit({
      id: habit.id,
      name: habit.name || "",
      color: habit.color || "var(--cal-blue)",
      emoji: habit.emoji || "",
      frequency: habit.frequency || "daily", // Default if not set
      days_of_week: habit.days_of_week || [] // Default to empty array if not set
    });
    setSelectedEmoji(habit.emoji || ""); // Set the emoji from the habit data
    setIsModalOpen(true);
  };
  
  
  
  const handleClose = async () => {
    setSelectedHabit(null);
    setIsModalOpen(false);
    setShowEmojiPicker(false);
    await fetchHabits(); // Re-fetch data to display on the table
  };
  
  const handleSave = async (habit: any) => {
    try {
      // Reference to the document in the 'main' collection
      const mainDocRef = doc(db, "habits", "main");
  
      if (habit.id) {
        // Update existing habit
        const habitDocRef = doc(collection(mainDocRef, "habits_refrence"), habit.id);
        await updateDoc(habitDocRef, {
          name: habit.name,
          color: habit.color,
          emoji: selectedEmoji,
          frequency: habit.frequency,
          days_of_week: habit.days_of_week || [],
          userId: userId, // Ensure the userId is updated as well
        });
        console.log("Updated habit:", habit);
      } else {
        // Create new habit
        await addDoc(collection(mainDocRef, "habits_refrence"), {
          name: habit.name,
          color: habit.color,
          emoji: selectedEmoji,
          habit_id: uuidv4(),
          frequency: habit.frequency,
          days_of_week: habit.days_of_week || [],
          userId: userId, // Set the userId for the new habit
        });
        console.log("Created new habit:", habit);
      }
  
      fetchHabits(); // Refresh the habits list after saving
      setIsModalOpen(false); // Close the modal after saving
    } catch (error) {
      console.error("Error saving habit:", error);
    }
  };


  const handleEmojiSelect = (emoji: any) => {
    setSelectedEmoji(emoji.native); // Set selected emoji
    setShowEmojiPicker(false); // Close picker after selecting
  };

  const handleOutsideClick = (e: MouseEvent) => {
    if (emojiPickerRef.current && !(emojiPickerRef.current as any).contains(e.target)) {
      setShowEmojiPicker(false); // Close picker only on click outside
    }
  };
  


  useEffect(() => {
    fetchHabits();
  }, []);


  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick); // Listen for clicks outside the emoji picker
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick); // Cleanup on unmount
    };
  }, [showEmojiPicker]);


  return (
      
    <div className={styles.bg}>
      <div className={styles.header}>
        <HeaderMain className="top-0" />
      </div>
    
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className={styles.settingsContent}>
        <div className={styles.habitsTable}>

          <div className={styles.settingsGroup}>
            <h2 className="text-xl font-semibold ">Habits</h2>
            <Button
              aria-label="New Habit Button"
              color="secondary"
              variant="flat"
              onPress={() => {
                setSelectedHabit({ name: "", color: "var(--cal-blue)" }); // Default values for a new habit
                setIsModalOpen(true);
              }}
            >
              New Habit
            </Button>
          </div>
          <Table selectionMode="single" color="secondary" removeWrapper aria-label="Habits Table">
            <TableHeader>
              <TableColumn>&nbsp;</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Color</TableColumn>
            </TableHeader>
            <TableBody>
              {habits.map((habit) => (
                <TableRow key={habit.id} onClick={() => handleRowClick(habit)}>
                  <TableCell>
                  <div 
                      style={{
                        fontSize: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center", 
                        justifyContent: "flex-end",
                      }}
                    >{habit.emoji}</div>
                    </TableCell>
                  <TableCell>{habit.name}</TableCell>
                  <TableCell>
                    <div 
                      style={{
                        backgroundColor: habit.color,
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                      }}
                    ></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div> 
      </div>
      </div>



      {selectedHabit && (
        <Modal className="overflow-visible" placement="center" isDismissable={false} isKeyboardDismissDisabled={false} size="4xl" isOpen={isModalOpen} onOpenChange={handleClose}>
        <ModalContent>
        <ModalHeader className="items-center flex flex-row gap-3 text-3xl">
          {selectedHabit?.id && (
            <FaTrash
              className="text-2xl text-red-500 cursor-pointer"
              onClick={async () => {
                if (selectedHabit) {
                  try {
                    const habitDocRef = doc(collection(db, "habits", "main", "habits_refrence"), selectedHabit.id);
                    await deleteDoc(habitDocRef); // Function to delete the document
                    handleClose(); // Close the modal after deleting
                    console.log('Habit deleted successfully');
                  } catch (error) {
                    console.error('Error deleting habit:', error);
                  }
                }
              }}
            />
          )}
          <div className="relative">
            <button
              className="cursor-pointer"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {selectedEmoji || "😀"} {/* Show selected emoji or default */}
            </button>
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef} 
                className="absolute z-20"
              >
                <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect} />
              </div>
            )}
          </div>
          {selectedHabit?.name ? 'Edit Habit' : 'New Habit'} {/* Header changes based on if editing or creating */}
          <div className="relative items-center justify-center">
            <div
              className="w-6 h-6 rounded-full cursor-pointer"
              style={{ backgroundColor: selectedHabit?.color || "var(--cal-blue)" }} // Show current color
              onClick={() => setShowColorPicker(!showColorPicker)} // Toggle color picker
            />
            <div
              className={`absolute top-1 bottom-1 left-full ml-1 flex flex-row items-center justify-center shadow-lg z-50 transition-transform transition-opacity duration-300 ease-in-out ${
                showColorPicker ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
              } origin-left`}
              style={{ transformOrigin: "left" }}
            >
              {['var(--cal-blue)', 'var(--cal-purple)', 'var(--cal-green)', 'var(--cal-red)', 'var(--cal-yellow)', 'var(--cal-grey)'].map((clr) => (
                <div
                  key={clr}
                  className={`w-5 h-5 rounded-full m-1 cursor-pointer ${clr === selectedHabit?.color ? "shadow-lg shadow-[0_0_5px_rgba(255,255,255,0.5)]" : ""}`}
                  style={{ backgroundColor: clr }}
                  onClick={() => {
                    setSelectedHabit({ ...selectedHabit, color: clr }); // Set selected color
                    setShowColorPicker(false); // Close color picker after selection
                  }}
                />
              ))}
            </div>
          </div>
        </ModalHeader>
      
          <ModalBody className="w-full">
            <Textarea
              label="Habit Name" // Add a field for habit name
              value={selectedHabit?.name || ""}
              onChange={(e) => setSelectedHabit({ ...selectedHabit, name: e.target.value })}
              fullWidth
              minRows={1}
            />
      
      <Select
        label="Frequency" // Add a field for habit name
        isRequired
        placeholder="Frequency"
        defaultSelectedKeys={[selectedHabit?.frequency || ""]}
        onChange={(e) => setSelectedHabit({
          ...selectedHabit, 
          frequency: e.target.value
        })}
        className="max-w-full"
      >
        <SelectItem key="custom" value="custom">Custom</SelectItem>
        <SelectItem key="daily" value="daily">Daily</SelectItem>
        <SelectItem key="every-other-day" value="every-other-day">Every Other Day</SelectItem>
        <SelectItem key="weekly" value="weekly">Weekly</SelectItem>
        <SelectItem key="monthly" value="monthly">Monthly</SelectItem>
      </Select>

        <Select
          label="Starts on..."
          defaultSelectedKeys={selectedHabit?.days_of_week?.split(',') || [""]} // Convert comma-separated string to an array
          isRequired
          selectionMode={selectedHabit.frequency === "custom" ? "multiple" : "single"} // Multiple if custom, single otherwise
          placeholder={
            selectedHabit.frequency === "custom"
              ? "Select days of the week"
              : "Select a day of the week"
          }
          onChange={(e) => setSelectedHabit({
            ...selectedHabit, 
            days_of_week: e.target.value
          })}
          className="max-w-full"
        >
          <SelectItem key="1" value="1">Monday</SelectItem>
          <SelectItem key="2" value="2">Tuesday</SelectItem>
          <SelectItem key="3" value="3">Wednesday</SelectItem>
          <SelectItem key="4" value="4">Thursday</SelectItem>
          <SelectItem key="5" value="5">Friday</SelectItem>
          <SelectItem key="6" value="6">Saturday</SelectItem>
          <SelectItem key="7" value="7">Sunday</SelectItem>
        </Select>
    

          </ModalBody>
      
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleClose}>
              Cancel
            </Button>
            <Button color="secondary" onPress={() => handleSave(selectedHabit)}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      )}
    </div>
  );
};

export default SettingsPage;
