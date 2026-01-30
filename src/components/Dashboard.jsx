import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { checkPremiumAccess } from '../services/firebaseService';
import PostAnalyzer from './PostAnalyzer';
import ReferenceDatabase from './ReferenceDatabase';
import { LogOut, Sparkles, Database } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('analyzer');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPremium = async () => {
      if (user) {
        const premium = await checkPremiumAccess(user.uid);
        setIsPremium(premium);
      }
      setLoading(false);
    };
    checkPremium();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="logo">Threads Analyzer</h1>
          <div className="header-actions">
            {isPremium && (
              <span className="premium-indicator">
                <Sparkles size={16} />
                Premium
              </span>
            )}
            <button onClick={handleSignOut} className="btn-icon" title="Sign Out">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'analyzer' ? 'active' : ''}`}
          onClick={() => setActiveTab('analyzer')}
        >
          <Sparkles size={18} />
          Post Analyzer
        </button>
        <button
          className={`nav-tab ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          <Database size={18} />
          Reference Database
        </button>
      </nav>

      <main className="dashboard-main">
        {activeTab === 'analyzer' && (
          <PostAnalyzer user={user} isPremium={isPremium} />
        )}
        {activeTab === 'database' && (
          <ReferenceDatabase user={user} isPremium={isPremium} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;