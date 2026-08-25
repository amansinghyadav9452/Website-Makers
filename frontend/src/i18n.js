import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: { home: 'Home', services: 'Services', portfolio: 'Portfolio', contact: 'Contact', blog: 'Blog', admin: 'Admin', portal: 'Client Portal' },
      hero: { title: 'We build websites that grow your business', subtitle: 'Premium web development, e-commerce stores, and web applications for Indian businesses.', cta: 'Start a Project', secondary: 'View Portfolio' },
      services: { title: 'Our Services', web: 'Web Development', ecommerce: 'E-commerce', seo: 'SEO & Marketing', app: 'Web Applications' },
      contact: { title: 'Get in Touch', name: 'Name', email: 'Email', phone: 'Phone', service: 'Service', message: 'Message', submit: 'Send Message', success: 'Message sent successfully!' },
      footer: { rights: 'All rights reserved.', newsletter: 'Subscribe to our newsletter', subscribe: 'Subscribe' },
      common: { loading: 'Loading...', error: 'Something went wrong', retry: 'Retry', close: 'Close', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', create: 'Create' }
    }
  },
  hi: {
    translation: {
      nav: { home: 'होम', services: 'सेवाएं', portfolio: 'पोर्टफोलियो', contact: 'संपर्क', blog: 'ब्लॉग', admin: 'एडमिन', portal: 'क्लाइंट पोर्टल' },
      hero: { title: 'हम वेबसाइट बनाते हैं जो आपका बिजनेस बढ़ाएं', subtitle: 'भारतीय व्यवसायों के लिए प्रीमियम वेब डेवलपमेंट, ई-कॉमर्स स्टोर और वेब एप्लिकेशन।', cta: 'प्रोजेक्ट शुरू करें', secondary: 'पोर्टफोलियो देखें' },
      services: { title: 'हमारी सेवाएं', web: 'वेब डेवलपमेंट', ecommerce: 'ई-कॉमर्स', seo: 'SEO और मार्केटिंग', app: 'वेब एप्लिकेशन' },
      contact: { title: 'संपर्क करें', name: 'नाम', email: 'ईमेल', phone: 'फोन', service: 'सेवा', message: 'संदेश', submit: 'भेजें', success: 'संदेश सफलतापूर्वक भेजा गया!' },
      footer: { rights: 'सर्वाधिकार सुरक्षित।', newsletter: 'हमारे न्यूज़लेटर को सब्सक्राइब करें', subscribe: 'सब्सक्राइब' },
      common: { loading: 'लोड हो रहा है...', error: 'कुछ गलत हो गया', retry: 'पुनः प्रयास करें', close: 'बंद करें', save: 'सहेजें', cancel: 'रद्द करें', delete: 'हटाएं', edit: 'संपादित करें', create: 'बनाएं' }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;
