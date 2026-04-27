import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider } from '../firebase/config';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Fetch or create user data
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          let role = user.email === 'karanak1513@gmail.com' ? 'admin' : 'user';

          if (!userSnap.exists()) {
            const newUserData = {
              uid: user.uid,
              name: user.displayName || user.email.split('@')[0],
              email: user.email,
              photoURL: user.photoURL || '',
              provider: user.providerData[0]?.providerId || 'email',
              role: role,
              walletBalance: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await setDoc(userRef, newUserData);
            setUserData(newUserData);
          } else {
             // Ensure role is correctly updated if it was changed
             const existingData = userSnap.data();
             if(existingData.role !== role) {
                await setDoc(userRef, { ...existingData, role: role, updatedAt: new Date().toISOString() }, { merge: true });
                existingData.role = role;
             }
             setUserData(existingData);
          }

          // Listen for wallet balance and data changes
          const unsubscribeUser = onSnapshot(userRef, (doc) => {
              if(doc.exists()) {
                  setUserData(doc.data());
              }
          }, (err) => {
              console.error("Auth snapshot error:", err);
          });
          
          setLoading(false);
          return () => unsubscribeUser();
        } catch (error) {
          console.error("AuthContext Error:", error);
          // If firestore read fails (e.g., due to rules), still stop loading so app doesn't go blank
          setUserData(null);
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    userData,
    login,
    signup,
    loginWithGoogle,
    logout,
    isAdmin: userData?.role === 'admin' || currentUser?.email === 'karanak1513@gmail.com'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
