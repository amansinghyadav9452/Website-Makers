import React from 'react';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  return (
    <button 
      className="language-switcher"
      onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en')}
      aria-label="Switch language"
    >
      {i18n.language === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
    </button>
  );
}