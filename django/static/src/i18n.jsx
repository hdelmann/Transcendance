import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import enJSON from './translations/en.json'
import esJSON from './translations/es.json'
import frJSON from './translations/fr.json'


// not like to use this?
// have a look at the Quick start guide
// for passing in lng and translations on init


const languages = ['en', 'es', 'fr'];

i18n
    /*
     load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
     learn more: https://github.com/i18next/i18next-http-backend
    */
    .use(Backend)
    /*
     detect user language
     learn more: https://github.com/i18next/i18next-browser-languageDetector
    */
    .use(LanguageDetector)
    /*
     pass the i18n instance to react-i18next.
    */
    .use(initReactI18next)
    /*
     init i18next
     for all options read: https://www.i18next.com/overview/configuration-options
    */
    .init({
        supportedLngs: languages,
        fallbackLng: 'en', // use et if detected lng is not available
        saveMissing: true, // send not translated keys to endpoint
        debug: false,
        interpolation: { escapeValue: false },
        whitelist: languages,
        resources: {
            en: {"translation": enJSON},
            es: {"translation": esJSON},
            fr: {"translation": frJSON}
        },
        // backend: {
        //     // for all available options read the backend's repository readme file
        //     loadPath: '/locales/{{lng}}/{{ns}}.json'
        // },

        react: {
            useSuspense: false
        }
    })


export default i18n;