import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { auth, isFirebaseConfigured } from './firebase/config';
import './components/theme.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function SetupScreen() {
  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1>Threads Post Analyzer</h1>
        <p>Configure your environment to get started.</p>
        <ol>
          <li>Copy <code>.env.example</code> to <code>.env</code></li>
          <li>Add your Firebase config (API key, project ID, etc.)</li>
          <li>Add your Gemini API key</li>
          <li>Refresh this page</li>
        </ol>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isFirebaseConfigured()) {
    return (
      <div className="app">
        <Toaster position="top-right" />
        <div className="app-content">
          <SetupScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          },
          success: {
            iconTheme: {
              primary: 'var(--success-color)',
              secondary: 'var(--bg-secondary)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4444',
              secondary: 'var(--bg-secondary)',
            },
          },
        }}
      />
      <div className="app-content">
        {user ? <Dashboard user={user} /> : <Login />}
      </div>
    </div>
  );
}

export default App;
