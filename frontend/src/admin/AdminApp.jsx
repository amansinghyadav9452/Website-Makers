import { useState, useEffect, useCallback } from 'react';
import '../admin.css';
import { getToken, clearToken } from './hooks/useApi';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InquiriesTab from './components/InquiriesTab';
import ClientsTab from './components/ClientsTab';
import ReviewsTab from './components/ReviewsTab';
import AnalyticsTab from './components/AnalyticsTab';
import SettingsTab from './components/SettingsTab';

const TAB_COMPONENTS = {
  dashboard: Dashboard,
  inquiries: InquiriesTab,
  clients: ClientsTab,
  reviews: ReviewsTab,
  analytics: AnalyticsTab,
  settings: SettingsTab
};

export default function AdminApp() {
  const [token, setTokenState] = useState(() => getToken());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogin = useCallback((t) => {
    setTokenState(t);
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setActiveTab('dashboard');
  }, []);

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const ActiveComponent = TAB_COMPONENTS[activeTab] || Dashboard;

  return (
    <div className="admin-shell">
      {!isMobile && (
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      )}
      <main className="admin-main">
        {isMobile && (
          <div className="mobile-nav">
            <div className="brand-mark">
              <span>W</span>
              <div><b>Website</b> <em>Makers</em></div>
            </div>
            <select
              value={activeTab}
              onChange={e => setActiveTab(e.target.value)}
              className="mobile-tab-select"
            >
              <option value="dashboard">Dashboard</option>
              <option value="inquiries">Inquiries</option>
              <option value="clients">Clients</option>
              <option value="reviews">Reviews</option>
              <option value="analytics">Analytics</option>
              <option value="settings">Settings</option>
            </select>
            <button className="logout-btn" onClick={handleLogout}>Sign out</button>
          </div>
        )}
        <div className="admin-content">
          <ActiveComponent onLogout={handleLogout} />
        </div>
      </main>
    </div>
  );
}
