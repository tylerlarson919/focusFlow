// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import Firebase Storage


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebasegs://tradingty-6ed07.appspot.com
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);
const tasksCollection = collection(db, "tasks");



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
export { app, db, storage, tasksCollection };
