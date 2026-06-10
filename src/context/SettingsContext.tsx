import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  gstEnabled: boolean;
  defaultGstRate: number;
  isDarkMode: boolean;
  isLoading: boolean;
  toggleGst: (value: boolean) => Promise<void>;
  updateDefaultGstRate: (rate: number) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gstEnabled, setGstEnabled] = useState<boolean>(false);
  const [defaultGstRate, setDefaultGstRate] = useState<number>(5); // 5% standard textile rate
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedGst = await AsyncStorage.getItem('@settings_gst_enabled');
        const savedRate = await AsyncStorage.getItem('@settings_default_gst_rate');
        const savedTheme = await AsyncStorage.getItem('@settings_is_dark_mode');

        if (savedGst !== null) {
          setGstEnabled(JSON.parse(savedGst));
        }
        if (savedRate !== null) {
          setDefaultGstRate(parseFloat(savedRate));
        }
        if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        }
      } catch (e) {
        console.error('Failed to load application settings:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const toggleGst = async (value: boolean) => {
    try {
      setGstEnabled(value);
      await AsyncStorage.setItem('@settings_gst_enabled', JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save GST state setting:', e);
    }
  };

  const updateDefaultGstRate = async (rate: number) => {
    try {
      setDefaultGstRate(rate);
      await AsyncStorage.setItem('@settings_default_gst_rate', rate.toString());
    } catch (e) {
      console.error('Failed to save default GST rate setting:', e);
    }
  };

  const toggleTheme = async () => {
    try {
      const nextMode = !isDarkMode;
      setIsDarkMode(nextMode);
      await AsyncStorage.setItem('@settings_is_dark_mode', JSON.stringify(nextMode));
    } catch (e) {
      console.error('Failed to save theme setting:', e);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        gstEnabled,
        defaultGstRate,
        isDarkMode,
        isLoading,
        toggleGst,
        updateDefaultGstRate,
        toggleTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
