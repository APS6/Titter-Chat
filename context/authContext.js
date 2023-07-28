'use client'

import React, { createContext, useState, useEffect, useContext } from 'react';
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

    if (loading) {
      // You can render a loading component or return null while loading
      return null;
    }
  
    if (error) {
      // Handle any error that might occur during authentication
      console.error('Authentication Error:', error);
    }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuthContext, AuthContextProvider };
