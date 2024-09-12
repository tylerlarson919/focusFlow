// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, writeBatch } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import Firebase Storage


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "d13cf4aa75e61e62c52c8fca858d35dbe7348c4d",
  authDomain: "focusflow-693a5.firebaseapp.com",
  projectId: "focusflow-693a5",
  storageBucket: "focusflow-693a5.appspot.com",
  messagingSenderId: "824288440733",
  appId: "1:824288440733:web:94428e172841bfe481bf74",
};

// Initialize Firebasegs://tradingty-6ed07.appspot.com
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);
const tasksCollection = collection(db, "tasks");
const habitsCollection = collection(db, "habits");
const mainDocRef = doc(db, "habits", "main");
const habitsRefrenceCollection = collection(mainDocRef, "habits_refrence");
const habitsLogCollection = collection(mainDocRef, "habits_log");


// Firestore Collections and Functions
const sessionsCollection = collection(db, "sessions");

// LogSession Function - No Authentication Required
export const LogSession = async (session) => {
  try {
    const docRef = await addDoc(sessionsCollection, {
      ...session,
      // Remove userId, as we're not associating sessions with a specific user
    });
    console.log("Document written with ID: ", docRef.id);
    return docRef.id; // Return the session ID
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

// getSessions Function - No Authentication Required
export const getSessions = async () => {
  try {
    const querySnapshot = await getDocs(sessionsCollection);
    const sessions = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });
    return sessions;
  } catch (e) {
    console.error("Error getting documents: ", e);
  }
};

const createMissingHabitsInFirestore = async (habits) => {
  const batch = writeBatch(db);

  habits.forEach(habit => {
    // Check if habit_id is defined
    if (!habit.habit_id) {
      console.warn(`Skipping habit with undefined habit_id: ${habit.name}, Structure: ${JSON.stringify(habit)}`);
      return; // Skip this habit
    }

    // Generate a new document reference for each habit
    const habitDocRef = doc(collection(db, "habits", "main", "habits_log"));

    // Set the document with the habit details
    batch.set(habitDocRef, {
      name: habit.name,
      status: habit.status,
      color: habit.color,
      date: habit.date,
      habit_id: habit.habit_id,
    });
  });

  try {
    await batch.commit();
    console.log('Missing habits created successfully.');
  } catch (error) {
    console.error('Error creating missing habits:', error);
  }
};








export const getHabits = async () => {
  try {
    const querySnapshot = await getDocs(habitsLogCollection);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error getting habits: ", e);
  }
};

export const getTasks = async () => {
  try {
    const querySnapshot = await getDocs(tasksCollection);
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    return tasks;
  } catch (e) {
    console.error("Error getting documents: ", e);
  }
};



// Export the initialized Firebase app, auth, and db
export { app, db, storage, tasksCollection, habitsCollection, createMissingHabitsInFirestore };
