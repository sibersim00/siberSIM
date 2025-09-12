// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '../../public/assets/i18n';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for React
    },
  });

export default i18n;
