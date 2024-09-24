import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUsers] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(setUsers);
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
