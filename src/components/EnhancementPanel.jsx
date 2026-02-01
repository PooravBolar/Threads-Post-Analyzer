import { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './EnhancementPanel.css';

const EnhancementPanel = ({ enhancements, originalPost, onSelect }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('subtle');

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleUse = (text) => {
    onSelect(text);
    toast.success('Post updated!');
  };

  const getEnhancementText = () => {
    if (!enhancements) return '';
    if (typeof enhancements === 'string') return enhancements;
    return enhancements[activeTab] || enhancements.subtle || enhancements.moderate || enhancements.complete || '';
  };

  const getExplanation = () => {
    if (!enhancements || typeof enhancements === 'string') return '';
    if (enhancements.explanations && enhancements.explanations[activeTab]) {
      return enhancements.explanations[activeTab];
    }
    return '';
  };

  const tabs = [
    { id: 'subtle', label: 'Subtle' },
    { id: 'moderate', label: 'Moderate' },
    { id: 'complete', label: 'Complete Rewrite' }
  ];

  return (
    <div className="enhancement-panel">
      <div className="enhancement-header">
        <h3 className="enhancement-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          AI-Enhanced Versions
        </h3>
        <p className="enhancement-subtitle">
          Choose from AI-generated improvements based on your viral posts
        </p>
      </div>

      <div className="enhancement-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`enhancement-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="enhancement-content">
        <div className="enhanced-text">
          {getEnhancementText()}
        </div>

        {getExplanation() && (
          <div className="explanation">
            <Info size={16} />
            <div className="explanation-content">
              <strong>What changed:</strong> {getExplanation()}
            </div>
          </div>
        )}

        <div className="enhancement-actions">
          <button
            onClick={() => handleCopy(getEnhancementText(), activeTab)}
            className={`btn-copy ${copiedIndex === activeTab ? 'copied' : ''}`}
          >
            {copiedIndex === activeTab ? (
              <>
                <Check size={18} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy
              </>
            )}
          </button>
          <button
            onClick={() => handleUse(getEnhancementText())}
            className="btn-use"
          >
            Use This Version
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancementPanel;
