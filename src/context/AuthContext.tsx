import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, db } from '../api/supabase';

interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'user';
  email?: string;
}

interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if Supabase is actually configured
  const isSupabaseConfigured = !!process.env.EXPO_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (isSupabaseConfigured) {
          // Listen to auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              setUser(session.user);
              // Fetch user profile
              const { data: profile, error } = await db.getProfile(session.user.id);
              if (profile) {
                setUserProfile({
                  id: profile.id,
                  name: profile.name,
                  role: profile.role as 'admin' | 'user',
                  email: session.user.email,
                });
              } else {
                // If profile doesn't exist, create default
                const defaultProfile = {
                  id: session.user.id,
                  name: session.user.email?.split('@')[0] || 'User',
                  role: 'user' as const,
                };
                setUserProfile({ ...defaultProfile, email: session.user.email });
              }
              setIsAuthenticated(true);
            } else {
              setUser(null);
              setUserProfile(null);
              setIsAuthenticated(false);
            }
            setIsLoading(false);
          });

          return () => {
            subscription.unsubscribe();
          };
        } else {
          // Simulation/offline session check
          const mockSession = await AsyncStorage.getItem('@mock_session');
          if (mockSession) {
            const profile = JSON.parse(mockSession);
            setUser({ id: profile.id, email: profile.email });
            setUserProfile(profile);
            setIsAuthenticated(true);
          }
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Session restoration failed:', e);
        setIsLoading(false);
      }
    };

    checkSession();
  }, [isSupabaseConfigured]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      
      if (!isSupabaseConfigured) {
        // Mock credentials validation
        if (cleanEmail === 'admin@ahs.com' && password === 'admin123') {
          const profile: UserProfile = {
            id: 'usr_admin',
            name: 'Ahmad Hasan (Admin)',
            role: 'admin',
            email: 'admin@ahs.com',
          };
          setUser({ id: profile.id, email: profile.email });
          setUserProfile(profile);
          setIsAuthenticated(true);
          await AsyncStorage.setItem('@mock_session', JSON.stringify(profile));
          setIsLoading(false);
          return { success: true };
        } else if (cleanEmail === 'user@ahs.com' && password === 'user123') {
          const profile: UserProfile = {
            id: 'usr_sales_1',
            name: 'Zaid Hasan (Sales)',
            role: 'user',
            email: 'user@ahs.com',
          };
          setUser({ id: profile.id, email: profile.email });
          setUserProfile(profile);
          setIsAuthenticated(true);
          await AsyncStorage.setItem('@mock_session', JSON.stringify(profile));
          setIsLoading(false);
          return { success: true };
        } else {
          setIsLoading(false);
          return {
            success: false,
            error: 'Invalid mock credentials. Try admin@ahs.com (admin123) or user@ahs.com (user123)',
          };
        }
      }

      // Supabase Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // Fetch or create profile
        const { data: profile } = await db.getProfile(data.user.id);
        const userProf: UserProfile = {
          id: data.user.id,
          name: profile?.name || data.user.email?.split('@')[0] || 'User',
          role: (profile?.role as 'admin' | 'user') || 'user',
          email: data.user.email,
        };
        setUser(data.user);
        setUserProfile(userProf);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Authentication failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { success: false, error: error.message || 'An unknown error occurred during sign-in.' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      } else {
        await AsyncStorage.removeItem('@mock_session');
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileName = async (newName: string) => {
    if (!userProfile) return;
    try {
      const updatedProfile = { ...userProfile, name: newName };
      setUserProfile(updatedProfile);
      
      if (!isSupabaseConfigured) {
        await AsyncStorage.setItem('@mock_session', JSON.stringify(updatedProfile));
      } else {
        await supabase
          .from('profiles')
          .update({ name: newName })
          .eq('id', userProfile.id);
      }
    } catch (error) {
      console.error('Failed to update profile name:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
