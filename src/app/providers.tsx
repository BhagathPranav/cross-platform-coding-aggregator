'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';
import { pb } from '@/lib/pocketbase';
import { dbService, UserProfile } from '@/lib/db';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isMock: boolean;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  bookmarks: string[];
  toggleBookmark: (problemId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Initialize and check connection
  useEffect(() => {
    async function initAuth() {
      try {
        const online = await dbService.checkConnection();
        setIsMock(!online);

        if (online) {
          // Check if user is already logged in via PocketBase cookie/localStore
          if (pb.authStore.isValid && pb.authStore.model) {
            setUser({
              id: pb.authStore.model.id,
              email: pb.authStore.model.email,
              username: pb.authStore.model.username || pb.authStore.model.email.split('@')[0],
            });
            const bms = await dbService.getBookmarks(pb.authStore.model.id);
            setBookmarks(bms);
          } else {
            const bms = await dbService.getBookmarks('guest');
            setBookmarks(bms);
          }
        } else {
          // Mock Mode - retrieve mock session
          const storedUser = localStorage.getItem('mock_user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser) as UserProfile;
            setUser(parsed);
            const bms = await dbService.getBookmarks(parsed.id);
            setBookmarks(bms);
          } else {
            const bms = await dbService.getBookmarks('guest');
            setBookmarks(bms);
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (!isMock) {
        // PocketBase sign in
        const authData = await pb.collection('users').authWithPassword(email, password);
        const loggedInUser: UserProfile = {
          id: authData.record.id,
          email: authData.record.email,
          username: authData.record.username || authData.record.email.split('@')[0],
        };
        setUser(loggedInUser);
        const bms = await dbService.getBookmarks(loggedInUser.id);
        setBookmarks(bms);
      } else {
        // Simulated local sign in
        const storedProfiles = localStorage.getItem('mock_profiles');
        const profiles: UserProfile[] = storedProfiles ? JSON.parse(storedProfiles) : [];
        const found = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
        
        if (found) {
          setUser(found);
          localStorage.setItem('mock_user', JSON.stringify(found));
          const bms = await dbService.getBookmarks(found.id);
          setBookmarks(bms);
        } else {
          throw new Error('User not found. Try signing up instead!');
        }
      }
      setLoginModalOpen(false);
    } catch (err: any) {
      throw new Error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      if (!isMock) {
        // PocketBase signup
        await pb.collection('users').create({
          username,
          email,
          password,
          passwordConfirm: password,
        });
        // Auto-login after register
        await login(email, password);
      } else {
        // Simulated local signup
        const storedProfiles = localStorage.getItem('mock_profiles');
        const profiles: UserProfile[] = storedProfiles ? JSON.parse(storedProfiles) : [];
        const emailExists = profiles.some(p => p.email.toLowerCase() === email.toLowerCase());
        
        if (emailExists) {
          throw new Error('An account with this email already exists.');
        }

        const newUser: UserProfile = {
          id: `mock-user-${Date.now()}`,
          email,
          username,
        };
        
        profiles.push(newUser);
        localStorage.setItem('mock_profiles', JSON.stringify(profiles));
        setUser(newUser);
        localStorage.setItem('mock_user', JSON.stringify(newUser));
        const bms = await dbService.getBookmarks(newUser.id);
        setBookmarks(bms);
      }
      setLoginModalOpen(false);
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (!isMock) {
      pb.authStore.clear();
    } else {
      localStorage.removeItem('mock_user');
    }
    setUser(null);
    // Reload guest bookmarks
    dbService.getBookmarks('guest').then(setBookmarks);
  };

  const toggleBookmark = async (problemId: string) => {
    const activeUserId = user ? user.id : 'guest';
    try {
      const added = await dbService.toggleBookmark(activeUserId, problemId);
      if (added) {
        setBookmarks(prev => [...prev, problemId]);
      } else {
        setBookmarks(prev => prev.filter(id => id !== problemId));
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isMock,
        loginModalOpen,
        setLoginModalOpen,
        login,
        register,
        logout,
        bookmarks,
        toggleBookmark,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
