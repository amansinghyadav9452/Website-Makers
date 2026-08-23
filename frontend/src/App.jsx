import { useEffect } from 'react';
import { pageMarkup } from './pageMarkup';
import { initWebsiteInteractions } from './websiteInteractions';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sites-maker-3bkh.onrender.com';

export default function App() {
  useEffect(() => {
    const cleanup = initWebsiteInteractions(API_BASE_URL);
    return cleanup;
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: pageMarkup }} />;
}
