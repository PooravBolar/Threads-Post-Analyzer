import { useState } from 'react';
import { analyzePost, generateRecommendations } from '../services/analysisEngine';
import { enhancePostWithContext } from '../services/geminiService';
import { getReferenceData } from '../services/firebaseService';
import { isOwner, getOwnerUid } from '../utils/owner';
import { toast } from 'react-hot-toast';
import ScoreCard from './ScoreCard';
import EnhancementPanel from './EnhancementPanel';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Shield,
  Info,
  ChevronDown
} from 'lucide-react';
import './PostAnalyzer.css';

const PostAnalyzer = ({ user, isPremium }) => {
  const [postText, setPostText] = useState('');
  const [scores, setScores] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enhancements, setEnhancements] = useState(null);
  const [enhancing, setEnhancing] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const handleAnalyze = async () => {
    if (!postText.trim()) {
      toast.error('Please enter a post to analyze');
      return;
    }

    setLoading(true);
    try {
      const analysisResults = analyzePost(postText);
      setScores(analysisResults);
      
      const recs = generateRecommendations(analysisResults, postText);
      setRecommendations(recs);

      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Error analyzing post');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!postText.trim()) {
      toast.error('Please enter a post to enhance');
      return;
    }

    if (!isPremium) {
      toast.error('Premium feature. Please upgrade to access AI enhancement.');
      return;
    }

    setEnhancing(true);
    try {
      const refUid = isOwner(user) ? user.uid : getOwnerUid() || user.uid;
      const referenceData = await getReferenceData(refUid);
      const referenceTexts = referenceData
        .filter(ref => ref && ref.type === 'viral_post' && ref.postText)
        .map(ref => ref.postText)
        .slice(0, 10);

      const enhanced = await enhancePostWithContext(
        postText,
        referenceTexts,
        scores
      );
      setEnhancements(enhanced);
      toast.success('Post enhanced successfully!');
    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      toast.error(errorMessage);
      console.error('Enhancement error:', error);
    } finally {
      setEnhancing(false);
    }
  };

  const getPriorityIcon = (priority) => {
    const iconProps = { size: 18, strokeWidth: 2.5 };
    switch (priority) {
      case 'CRITICAL':
        return <AlertTriangle {...iconProps} />;
      case 'HIGH':
        return <Target {...iconProps} />;
      case 'MEDIUM':
        return <CheckCircle {...iconProps} />;
      default:
        return <CheckCircle {...iconProps} />;
    }
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority.toLowerCase()}`;
  };

  return (
    <div className="post-analyzer">
      <div className="analyzer-container">
        {/* Input Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Analyze Your Post</h2>
            <p className="card-subtitle">
              Get comprehensive analysis based on Threads ranking algorithm research
            </p>
          </div>
          <div className="card-body">
            {/* Note: guidelines dropdown */}
            <div className={`note-dropdown ${noteOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="note-dropdown-trigger"
                onClick={() => setNoteOpen(!noteOpen)}
                aria-expanded={noteOpen}
                aria-controls="note-content"
              >
                <Info size={18} />
                <span>Note</span>
                <ChevronDown size={18} className="note-chevron" />
              </button>
              <div id="note-content" className="note-dropdown-content" hidden={!noteOpen}>
                <ul className="note-list">
                  <li>This tool is trained for <strong>long-form posts</strong>.</li>
                  <li>Avoid using more than one emoji.</li>
                  <li>Every <code>&lt;new thread&gt;</code> means you should write that content in a new thread.</li>
                  <li>Run <strong>Analyze</strong> before <strong>Enhance with AI</strong> for best results.</li>
                </ul>
              </div>
            </div>

            <div className="input-wrapper">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's on your mind? Share your Threads post here..."
                className="post-textarea"
                aria-label="Post content"
              />
              <div className="char-count">
                {postText.length}
              </div>
            </div>

            <div className="action-buttons">
              <button
                onClick={handleAnalyze}
                disabled={loading || !postText.trim()}
                className="btn btn-primary"
                aria-label="Analyze post"
              >
                {loading ? (
                  'Analyzing...'
                ) : (
                  <>
                    Analyze Post
                  </>
                )}
              </button>

             <button
                  onClick={handleEnhance}
                  disabled={enhancing || !postText.trim() || !scores}
                  className="btn btn-premium"
                  aria-label="Enhance with AI"
                >
                  {enhancing ? (
                    'Enhancing...'
                  ) : (
                    <>
                      
                      Enhance with AI
                    </>
                  )}
              </button>
              
            </div>

            {!isPremium && (
              <div className="premium-prompt">
                <Sparkles size={18} />
                <span>Upgrade to Premium for AI-powered enhancement</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhancement Panel - shown on top when available */}
        {enhancements && isPremium && (
          <EnhancementPanel
            enhancements={enhancements}
            originalPost={postText}
            onSelect={(text) => setPostText(text)}
          />
        )}

        {/* Results Section */}
        {scores && (
          <div className="card">
            <div className="score-header">
              <div className="score-header-info">
                <h3>Analysis Results</h3>
                <p>Based on Threads ranking algorithm research</p>
              </div>
              <div className="overall-score-display">
                <div className="score-circle" style={{ '--score': scores.viral }}>
                  <div className="score-value">{scores.viral}</div>
                </div>
                <div className="score-label">Viral Score</div>
              </div>
            </div>

            <div className="card-body">
              {/* Safety Alerts */}
              {!scores.suppressionRisk.safe && (
                <div className="alert alert-critical">
                  <AlertTriangle size={20} />
                  <div className="alert-content">
                    <h4>Suppression Risk Detected</h4>
                    <ul>
                      {scores.suppressionRisk.risks.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {scores.rageBait.isRageBait && (
                <div className="alert alert-warning">
                  <Shield size={20} />
                  <div className="alert-content">
                    <h4>Rage Bait Detected</h4>
                    <p>High risk of Hide/Block actions. Consider softening controversial elements.</p>
                  </div>
                </div>
              )}

              {/* Detected Templates */}
              {scores.detectedTemplates.length > 0 && (
                <div className="templates-detected">
                  <div className="templates-header">
                    <CheckCircle size={18} />
                    Research-Backed Templates Detected
                  </div>
                  <div className="template-tags">
                    {scores.detectedTemplates.map((template, i) => (
                      <div key={i} className="template-tag">
                        #{template.number}: {template.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Core Metrics */}
            <div className="metrics-section">
              <h3 className="metrics-title">Core Metrics (Weighted by Algorithm)</h3>
              <div className="metrics-grid">
                <ScoreCard
                  title="Replies Potential"
                  score={scores.engagement}
                  description="10x weight - Most critical signal"
                  badge="10x"
                />
                <ScoreCard
                  title="Hook Strength"
                  score={scores.hook}
                  description="Stops the scroll"
                />
                <ScoreCard
                  title="Conversation Depth"
                  score={scores.conversationDepth}
                  description="Back-and-forth potential"
                />
                <ScoreCard
                  title="Dwell Time"
                  score={scores.readability}
                  description="6x weight - Reading ease"
                  badge="6x"
                />
                <ScoreCard
                  title="Velocity Potential"
                  score={scores.velocityPotential}
                  description="First-hour engagement speed"
                />
                <ScoreCard
                  title="Profile Tap Potential"
                  score={scores.profileTapPotential}
                  description="5x weight - Discovery signal"
                  badge="5x"
                />
              </div>
            </div>

            {/* Supporting Metrics */}
            <div className="metrics-section">
              <h3 className="metrics-title">Supporting Metrics</h3>
              <div className="metrics-grid">
                <ScoreCard
                  title="Visual Appeal"
                  score={scores.visual}
                  description="Line breaks and formatting"
                />
                <ScoreCard
                  title="CTA Quality"
                  score={scores.cta}
                  description="Call-to-action effectiveness"
                />
                <ScoreCard
                  title="Authenticity"
                  score={scores.authenticity}
                  description="Genuine conversational tone"
                />
                <ScoreCard
                  title="Sentiment"
                  score={scores.sentiment}
                  description="Positive emotional tone"
                />
                <ScoreCard
                  title="See More Potential"
                  score={scores.seeMorePotential}
                  description="Long-form expansion value"
                />
                <ScoreCard
                  title="Saves Potential"
                  score={scores.savesPotential}
                  description="Reference value for users"
                />
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recommendations</h2>
              <p className="card-subtitle">
                Prioritized actions to improve viral potential
              </p>
            </div>
            <div className="card-body">
              <div className="recommendations-list">
                {recommendations.map((rec, i) => (
                  <div key={i} className={`recommendation ${getPriorityClass(rec.priority)}`}>
                    <div className="rec-icon">
                      {getPriorityIcon(rec.priority)}
                    </div>
                    <div className="rec-content">
                      <div className="rec-category">{rec.category}</div>
                      <div className="rec-action">{rec.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostAnalyzer;
