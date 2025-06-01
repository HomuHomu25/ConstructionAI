import React, { createContext, useContext, useState, useEffect } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Add debug logs
console.log('Imported FIREBASE_AUTH:', auth());
console.log('FIREBASE_AUTH type:', typeof auth());
console.log('FIREBASE_AUTH properties:', Object.keys(auth() || {}));

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  // Add debug log for auth instance
  console.log('Auth instance in provider:', auth());

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      setUser(userCredential.user);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to login');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      // You can add additional user info to Firestore here if needed
      setUser(userCredential.user);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const logout = async () => {
    try {
      await auth().signOut();
      setUser(null);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to logout');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 