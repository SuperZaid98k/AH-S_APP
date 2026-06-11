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
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  updateProfile: (name: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (phone: string, password: string, name: string, role: 'admin' | 'user') => Promise<{ success: boolean; error?: string }>;
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

  const login = async (emailOrPhone: string, password: string) => {
    setIsLoading(true);
    try {
      const input = emailOrPhone.trim().toLowerCase();
      const isEmail = input.includes('@');
      const emailValue = isEmail ? input : `${input.replace(/[^0-9+]/g, '')}@ahs-billing.com`;
      
      if (!isSupabaseConfigured) {
        // Mock credentials validation
        if (emailValue === 'admin@ahs.com' && password === 'admin123') {
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
        } else if (emailValue === 'user@ahs.com' && password === 'user123') {
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
          // Check `@mock_created_users` inside AsyncStorage
          const createdUsersStr = await AsyncStorage.getItem('@mock_created_users');
          const createdUsers = createdUsersStr ? JSON.parse(createdUsersStr) : [];
          const matchedUser = createdUsers.find((u: any) => u.email === emailValue && u.password === password);
          if (matchedUser) {
            const profile: UserProfile = {
              id: matchedUser.id,
              name: matchedUser.name,
              role: matchedUser.role,
              email: matchedUser.email,
            };
            setUser({ id: profile.id, email: profile.email });
            setUserProfile(profile);
            setIsAuthenticated(true);
            await AsyncStorage.setItem('@mock_session', JSON.stringify(profile));
            setIsLoading(false);
            return { success: true };
          }

          setIsLoading(false);
          return {
            success: false,
            error: 'Invalid credentials. Try registering a new user or check phone number.',
          };
        }
      }


      // Supabase Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValue,
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

  const updateProfile = async (newName: string, newPhone: string) => {
    if (!userProfile) return { success: false, error: 'No user session found' };
    try {
      const cleanPhone = newPhone.trim();
      const isEmail = cleanPhone.includes('@');
      const emailValue = isEmail ? cleanPhone : `${cleanPhone.replace(/[^0-9+]/g, '')}@ahs-billing.com`;
      
      const updatedProfile = { ...userProfile, name: newName.trim(), email: emailValue };
      
      if (!isSupabaseConfigured) {
        // Update mock session
        setUser({ ...user, email: emailValue });
        setUserProfile(updatedProfile);
        await AsyncStorage.setItem('@mock_session', JSON.stringify(updatedProfile));
        
        // Update mock users list
        const createdUsersStr = await AsyncStorage.getItem('@mock_created_users');
        if (createdUsersStr) {
          const createdUsers = JSON.parse(createdUsersStr);
          const updatedUsers = createdUsers.map((u: any) =>
            u.id === userProfile.id ? { ...u, name: newName.trim(), email: emailValue } : u
          );
          await AsyncStorage.setItem('@mock_created_users', JSON.stringify(updatedUsers));
        }
        return { success: true };
      }

      // Supabase Mode
      // 1. Update profiles table (name)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: newName.trim() })
        .eq('id', userProfile.id);

      if (profileError) throw profileError;

      // 2. Update auth.users (email/phone mapping) if it has changed
      if (emailValue !== userProfile.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: emailValue,
        });
        if (authError) {
          throw authError;
        }
      }

      // Update local state
      setUser({ ...user, email: emailValue });
      setUserProfile(updatedProfile);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      return { success: false, error: error.message || 'Failed to update profile details.' };
    }
  };

  const signUp = async (phone: string, password: string, name: string, role: 'admin' | 'user') => {
    setIsLoading(true);
    try {
      const cleanPhone = phone.trim().toLowerCase();
      const isEmail = cleanPhone.includes('@');
      const emailValue = isEmail ? cleanPhone : `${cleanPhone.replace(/[^0-9+]/g, '')}@ahs-billing.com`;
      
      if (!isSupabaseConfigured) {
        const createdUsersStr = await AsyncStorage.getItem('@mock_created_users');
        const createdUsers = createdUsersStr ? JSON.parse(createdUsersStr) : [];
        
        // Check if user already exists
        const userExists = createdUsers.some((u: any) => u.email === emailValue) ||
                           emailValue === 'admin@ahs.com' ||
                           emailValue === 'user@ahs.com';
        if (userExists) {
          setIsLoading(false);
          return { success: false, error: 'User already exists with this phone number.' };
        }

        const newId = 'usr_' + Date.now();
        const newUser = {
          id: newId,
          email: emailValue,
          password: password,
          name: name.trim(),
          role: role,
        };

        createdUsers.push(newUser);
        await AsyncStorage.setItem('@mock_created_users', JSON.stringify(createdUsers));
        setIsLoading(false);
        return { success: true };
      }

      // Supabase Signup
      const { data, error } = await supabase.auth.signUp({
        email: emailValue,
        password,
        options: {
          data: {
            name: name.trim(),
            role: role,
          },
        },
      });

      if (error) throw error;
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error('Sign Up error:', error);
      setIsLoading(false);
      return { success: false, error: error.message || 'An unknown error occurred during registration.' };
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
        updateProfile,
        signUp,
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
