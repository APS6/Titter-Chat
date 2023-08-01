'use client'

import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initFirebase } from '@/firebase/app';
import { useAuthState } from 'react-firebase-hooks/auth';

const auth = getAuth(initFirebase());

const AuthContext = createContext();


const useAuthContext = () => {
    return useContext(AuthContext);
  };

  
const AuthContextProvider = ({ children }) => {
    const [user, loading, error] = useAuthState(auth);
    const [accessToken, setAccessToken] = useState("");

    useEffect(() => {
      if (user) {
        user.getIdToken().then((token) => {
          setAccessToken(token);
        }).catch((error) => {
          console.error('Error getting access token:', error);
        });
      }
    }, [user]);

    if (loading) {
      return null;
    }
  
    if (error) {
      console.error('Authentication Error:', error);
    }

  return (
    <AuthContext.Provider value={{ user, loading, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuthContext, AuthContextProvider };
