import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TRANSLATIONS } from '../config/Translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const loadLang = async () => {
      try {
        const saved = await AsyncStorage.getItem('gymvault_lang');
        if (saved && TRANSLATIONS[saved]) {
          setLanguageState(saved);
        }
      } catch (e) {
        console.log('Failed to load language', e);
      }
    };
    loadLang();
  }, []);

  const setLanguage = async (langCode) => {
    if (TRANSLATIONS[langCode]) {
      setLanguageState(langCode);
      try {
        await AsyncStorage.setItem('gymvault_lang', langCode);
      } catch (e) {
        console.log('Failed to save language', e);
      }
    }
  };

  const t = (key) => {
    return TRANSLATIONS[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
