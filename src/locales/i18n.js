import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { TRANSLATIONS_PT } from './pt/translations.js';
import { TRANSLATIONS_ES } from './es/translations.js';
import { TRANSLATIONS_EN } from './en/translations.js';
import { TRANSLATIONS_zh_CN } from './zh_CN/translations.js';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: TRANSLATIONS_EN,
      },
      pt: {
        translation: TRANSLATIONS_PT,
      },
      es: {
        translation: TRANSLATIONS_ES,
      },
      zh_CN:{
        translation: TRANSLATIONS_zh_CN,
      }
    },
    fallbackLng: 'en',
  });
