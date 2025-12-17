'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider
} from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { deleteUserData } from '@/lib/firestoreEntries';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, displayName?: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithApple: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  reauthenticateUser: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const auth = getAuthInstance();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'auth:', error);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = getAuthInstance();
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const auth = getAuthInstance();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential;
  };

  const logout = async () => {
    const auth = getAuthInstance();
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    const auth = getAuthInstance();
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (displayName: string) => {
    const auth = getAuthInstance();
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
    }
  };

  const signInWithGoogle = async () => {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  };

  const signInWithApple = async () => {
    const auth = getAuthInstance();
    const provider = new OAuthProvider('apple.com');
    // Ajouter les scopes nécessaires pour Apple Sign-In
    provider.addScope('email');
    provider.addScope('name');
    // Utiliser signInWithPopup, avec fallback sur redirect si nécessaire
    try {
      return await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Si popup échoue, essayer avec redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        throw error; // Re-lancer l'erreur pour que l'UI puisse la gérer
      }
      // Pour d'autres erreurs, re-lancer aussi
      throw error;
    }
  };

  /**
   * Ré-authentifie l'utilisateur selon son provider
   * @param password - Mot de passe requis pour les comptes email/password
   */
  const reauthenticateUser = async (password?: string) => {
    const auth = getAuthInstance();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    // Détecter le provider principal
    const providerId = currentUser.providerData[0]?.providerId;
    
    if (providerId === 'password') {
      // Ré-authentification avec email/password
      if (!password) {
        throw new Error('Le mot de passe est requis pour la ré-authentification');
      }
      if (!currentUser.email) {
        throw new Error('Email non disponible');
      }
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
    } else if (providerId === 'google.com') {
      // Ré-authentification avec Google
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(currentUser, provider);
    } else if (providerId === 'apple.com') {
      // Ré-authentification avec Apple
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await reauthenticateWithPopup(currentUser, provider);
    } else {
      throw new Error(`Provider non supporté: ${providerId}`);
    }
  };

  const deleteAccount = async (password?: string) => {
    const auth = getAuthInstance();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    const userId = currentUser.uid;

    try {
      // Supprimer toutes les données Firestore
      await deleteUserData(userId);
      // Supprimer le compte Firebase Auth
      await deleteUser(currentUser);
    } catch (error: any) {
      // Si l'erreur est "requires-recent-login", ré-authentifier puis réessayer
      if (error.code === 'auth/requires-recent-login') {
        // Ré-authentifier l'utilisateur (le mot de passe est requis pour email/password)
        await reauthenticateUser(password);
        
        // Réessayer la suppression après ré-authentification
        await deleteUserData(userId);
        await deleteUser(currentUser);
      } else {
        // Re-lancer l'erreur si ce n'est pas une erreur de ré-authentification
        throw error;
      }
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    logout,
    resetPassword,
    updateUserProfile,
    deleteAccount,
    reauthenticateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

