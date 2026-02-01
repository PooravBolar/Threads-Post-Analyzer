import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { checkPremiumAccess } from '../services/firebaseService';
import PostAnalyzer from './PostAnalyzer';
import ReferenceDatabase from './ReferenceDatabase';
import { LogOut, Sparkles, Database, AtSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './theme.css';
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
          <div className="logo">
            <img src="Threads.png" alt="Threads Logo" height={40}/>
            <span className="logo-text">Threads Post Analyzer</span>
          </div>
          <div className="header-actions">
            <div className="premium-badge">
                <Sparkles size={14} />
                Premium
            </div>
            
            <button 
              onClick={handleSignOut} 
              className="btn-icon" 
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <div className="nav-container">
          <button
            className={`nav-tab ${activeTab === 'analyzer' ? 'active' : ''}`}
            onClick={() => setActiveTab('analyzer')}
            aria-label="Post Analyzer"
          >
            <Sparkles size={20} />
            <span>Analyzer</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'database' ? 'active' : ''}`}
            onClick={() => setActiveTab('database')}
            aria-label="Reference Database"
          >
            <Database size={20} />
            <span>Database</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-main-inner">
          {activeTab === 'analyzer' && (
            <PostAnalyzer user={user} isPremium="true" />
          )}
          {activeTab === 'database' && (
            <ReferenceDatabase user={user} isPremium="true" />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
