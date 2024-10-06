"use client";
import React, { useState } from 'react';
import { signInWithEmailLink, sendSignInLinkToEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Input, Button, Card, CardBody, CardFooter, CardHeader } from "@nextui-org/react";
import { Link } from "@nextui-org/link"; // Import NextUI Link
import { useRouter } from 'next/navigation';
import { auth } from '../../../firebaseConfig'; // Adjust the path as necessary
import styles from './page.module.css'; // Optional: Custom styles

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLoginWithEmail = async () => {
    const actionCodeSettings = {
      url: window.location.origin + '/login', // Redirect URL after email verification
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save the email locally to complete sign-in later
      window.localStorage.setItem('emailForSignIn', email);
      alert('Check your email for the login link!'); // Inform the user
    } catch (err) {
      console.error(err); // Log the error for debugging
      setError("Failed to send login link. Please try again.");
    }
  };

  const handleLoginWithGoogle = async () => {
    const provider = new GoogleAuthProvider(); // Use GoogleAuthProvider from Firebase
    try {
      await signInWithPopup(auth, provider); // Use signInWithPopup
      router.push('/'); // Redirect to home page after successful login
    } catch (err) {
      console.error(err); // Log the error for debugging
      setError("Google login failed. Please try again.");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Card isBlurred className="w-1/3">
        <CardHeader>
          <h2 className="text-lg font-bold">Login</h2>
        </CardHeader>
        <CardBody>
          <Input 
            type="email" 
            placeholder="Enter your email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            fullWidth 
            required 
          />
          {error && <p className="text-red-500 mt-4 text-sm text-center">{error}</p>}
        </CardBody>
        <CardFooter className="flex-col">
          <Link href="/register" className="text-center text-sm">Don't have an account? Register</Link>
          <Button onClick={handleLoginWithEmail} variant="bordered" color="secondary" fullWidth className="mt-1">
            Send Login Link
          </Button>
          <Button onClick={handleLoginWithGoogle} color="secondary" fullWidth className="mt-3">
            Login with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
