import { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './EnhancementPanel.css';

const EnhancementPanel = ({ enhancements, originalPost, onSelect }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('subtle');

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
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

  return (
    <div className="enhancement-panel">
      <div className="panel-header">
        <div className="header-title">
          <Sparkles size={20} />
          <h2>AI-Enhanced Versions</h2>
        </div>
        <p className="header-subtitle">
          Choose from AI-generated improvements based on your viral posts
        </p>
      </div>

      <div className="enhancement-tabs">
        <button
          className={`tab ${activeTab === 'subtle' ? 'active' : ''}`}
          onClick={() => setActiveTab('subtle')}
        >
          Subtle
        </button>
        <button
          className={`tab ${activeTab === 'moderate' ? 'active' : ''}`}
          onClick={() => setActiveTab('moderate')}
        >
          Moderate
        </button>
        <button
          className={`tab ${activeTab === 'complete' ? 'active' : ''}`}
          onClick={() => setActiveTab('complete')}
        >
          Complete Rewrite
        </button>
      </div>

      <div className="enhancement-content">
        <div className="enhanced-text">
          {getEnhancementText() || 'No enhancement available'}
        </div>

        {getExplanation() && (
          <div className="explanation">
            <strong>What changed:</strong> {getExplanation()}
          </div>
        )}

        <div className="enhancement-actions">
          <button
            onClick={() => handleCopy(getEnhancementText(), activeTab)}
            className="btn btn-secondary"
          >
            {copiedIndex === activeTab ? (
              <>
                <Check size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy
              </>
            )}
          </button>
          <button
            onClick={() => handleUse(getEnhancementText())}
            className="btn btn-primary"
          >
            Use This Version
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancementPanel;