// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { query, where, getFirestore, collection, addDoc, getDocs, getDoc, doc, writeBatch, setDoc } from "firebase/firestore";
import { subHours } from 'date-fns';
import { getAuth } from 'firebase/auth';

import { getStorage } from "firebase/storage"; // Import Firebase Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB85PzqamaBqI24MA6v7eHmPrBJ9fVGzk4",
  authDomain: "focusflow-693a5.firebaseapp.com",
  projectId: "focusflow-693a5",
  storageBucket: "focusflow-693a5.appspot.com",
  messagingSenderId: "824288440733",
  appId: "1:824288440733:web:94428e172841bfe481bf74",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Get the auth instance
const storage = getStorage(app);
const db = getFirestore(app);
const tasksCollection = collection(db, "tasks");
const habitsCollection = collection(db, "habits");
const mainDocRef = doc(db, "habits", "main");
const habitsRefrenceCollection = collection(mainDocRef, "habits_refrence");
const habitsLogCollection = collection(mainDocRef, "habits_log");

// Firestore Collections and Functions
const sessionsCollection = collection(db, "sessions");

// LogSession Function - Authentication Required
export const LogSession = async (session) => {
  const user = auth.currentUser; // Get the current user
  if (!user) {
    console.error("User not authenticated.");
    return;
  }

  try {
    const docRef = await addDoc(sessionsCollection, {
      ...session,
      userId: user.uid, // Add user ID to the session data
    });
    console.log("Document written with ID: ", docRef.id);
    return docRef.id; // Return the session ID
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

// getSessions Function - No Authentication Required
export const getSessions = async () => {
  const user = auth.currentUser; // Get the current user
  if (!user) {
    console.error("User not authenticated.");
    return [];
  }

  try {
    const q = query(sessionsCollection, where("userId", "==", user.uid)); // Filter by user ID
    const querySnapshot = await getDocs(q);
    const sessions = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    return sessions;
  } catch (e) {
    console.error("Error getting documents: ", e);
  }
};

export const createOrUpdateHabitInFirestore = async (habit) => {
  const user = auth.currentUser; // Get the current user
  if (!user) {
    console.error("User not authenticated.");
    return;
  }

  try {
    const { id, ...habitData } = habit;
    const currentDate = subHours(new Date(), 4).toISOString().split('T')[0];  // Get current date in YYYY-MM-DD format

    // Query the habits_log collection to find if a document with the same habit_id and date exists
    const habitQuery = query(
      collection(db, 'habits/main/habits_log'),
      where('habit_id', '==', id),
      where('date', '==', currentDate)
    );

    const querySnapshot = await getDocs(habitQuery);
    const existingDoc = querySnapshot.docs[0];

    if (existingDoc) {
      // Document exists, update it
      const habitRef = doc(db, 'habits/main/habits_log', existingDoc.id);
      await setDoc(habitRef, {
        ...habitData,
        status: habit.status,
        updatedAt: new Date().toISOString().split('T')[0], // Ensure updated date is current date
      }, { merge: true });

      console.log(`Habit ${id} updated with ID: ${existingDoc.id}`);
    } else {
      // Document does not exist, create a new one
      const habitRef = await addDoc(collection(db, 'habits/main/habits_log'), {
        ...habitData,
        status: habit.status,
        date: currentDate, // Set current date only
      });

      // Update the document to set the habit_id field
      await setDoc(habitRef, { habit_id: id }, { merge: true });

      console.log(`Habit created with ID: ${habitRef.id}`);
    }
  } catch (error) {
    console.error('Error creating/updating habit:', error);
  }
};

/**
 * Fetches the status of a habit from the habits_log collection.
 * @param {string} habitId - The habit ID to fetch the status for.
 * @returns {Promise<string | null>} - The status of the habit or null if no document exists.
 */
export const getHabitLogStatus = async (habitId) => {
  const user = auth.currentUser; // Get the current user
  if (!user) {
    console.error("User not authenticated.");
    return null; // Return null or appropriate default value
  }

  try {
    const currentDate = subHours(new Date(), 4).toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const habitQuery = query(
      collection(db, 'habits/main/habits_log'),
      where('habit_id', '==', habitId),
      where('date', '==', currentDate)
    );
    const querySnapshot = await getDocs(habitQuery);

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      return data.status || 'incomplete'; // Default to 'incomplete' if no status is found
    } else {
      return 'incomplete'; // No document found for today, default to 'incomplete'
    }
  } catch (error) {
    console.error('Error fetching habit status:', error);
    return 'incomplete'; // Return 'incomplete' in case of an error
  }
};

export const getHabits = async () => {
  const user = auth.currentUser; // Get the current user
  if (!user) {
    console.error("User not authenticated.");
    return []; // Return an empty array or appropriate default value
  }

  try {
    const querySnapshot = await getDocs(habitsLogCollection);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error getting habits: ", e);
  }
};

export const getTasks = async () => {
  const user = auth.currentUser; // Get the current user
  if (!user) {
    console.error("User not authenticated.");
    return []; // Return an empty array or appropriate default value
  }

  try {
    const q = query(tasksCollection, where("userId", "==", user.uid)); // Filter tasks by user ID
    const querySnapshot = await getDocs(q);
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    return tasks;
  } catch (e) {
    console.error("Error getting tasks: ", e);
  }
};

// Export the initialized Firebase app, auth, and db
export { app, db, storage, tasksCollection, habitsCollection };
