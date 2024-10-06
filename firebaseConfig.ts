// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
const auth = getAuth(app); // Initialize auth instance

export { app, auth };
