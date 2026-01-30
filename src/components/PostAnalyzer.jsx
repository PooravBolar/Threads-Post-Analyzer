import { useState } from 'react';
import { analyzePost, generateRecommendations } from '../services/analysisEngine';
import { analyzePostWithContext, enhancePostWithContext } from '../services/geminiService';
import { getReferenceData } from '../services/firebaseService';
import { saveAnalysisResult } from '../services/firebaseService';
import { toast } from 'react-hot-toast';
import ScoreCard from './ScoreCard';
import EnhancementPanel from './EnhancementPanel';
import { Sparkles, TrendingUp, Zap, AlertTriangle, CheckCircle, Info, Target, Eye, MessageCircle, Clock, Shield } from 'lucide-react';
import './PostAnalyzer.css';

const PostAnalyzer = ({ user, isPremium }) => {
  const [postText, setPostText] = useState('');
  const [scores, setScores] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enhancements, setEnhancements] = useState(null);
  const [enhancing, setEnhancing] = useState(false);

  const handleAnalyze = async () => {
    if (!postText.trim()) {
      toast.error('Please enter a post to analyze');
      return;
    }

    setLoading(true);
    try {
      // Complete analysis with all research-based metrics
      const analysisResults = analyzePost(postText);
      setScores(analysisResults);
      
      // Generate recommendations based on analysis
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
      const referenceData = await getReferenceData(user.uid);
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
    switch (priority) {
      case 'CRITICAL':
        return <AlertTriangle size={16} />;
      case 'HIGH':
        return <Target size={16} />;
      case 'MEDIUM':
        return <Info size={16} />;
      default:
        return <CheckCircle size={16} />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'priority-critical';
      case 'HIGH':
        return 'priority-high';
      case 'MEDIUM':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  };

  return (
    <div className="post-analyzer">
      <div className="analyzer-container">
        <div className="input-section">
          <div className="section-header">
            <div>
              <h2>Analyze Your Post</h2>
              <p className="section-subtitle">
                Get comprehensive analysis based on Threads ranking algorithm research
              </p>
            </div>
          </div>

          <div className="textarea-wrapper">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's on your mind? Share your Threads post here..."
              className="post-textarea"
              rows={8}
            />
            <div className="char-count">
              {postText.length} characters
            </div>
          </div>

          <div className="action-buttons">
            <button
              onClick={handleAnalyze}
              disabled={loading || !postText.trim()}
              className="btn btn-primary"
            >
              {loading ? (
                <>Analyzing...</>
              ) : (
                <>
                  <TrendingUp size={18} />
                  Analyze Post
                </>
              )}
            </button>

            {isPremium && (
              <button
                onClick={handleEnhance}
                disabled={enhancing || !postText.trim() || !scores}
                className="btn btn-premium"
              >
                {enhancing ? (
                  <>Enhancing...</>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Enhance with AI
                  </>
                )}
              </button>
            )}
          </div>

          {!isPremium && (
            <div className="premium-prompt">
              <Sparkles size={16} />
              <span>Upgrade to Premium for AI-powered analysis and enhancement</span>
            </div>
          )}
        </div>

        {scores && (
          <>
            <div className="results-section">
              <div className="section-header">
                <div>
                  <h2>Analysis Results</h2>
                  <p className="section-subtitle">Based on Threads ranking algorithm research</p>
                </div>
                <div className="overall-score">
                  <div className="score-value">{scores.viral}</div>
                  <div className="score-label">Viral Score</div>
                </div>
              </div>

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
                    <p>High risk of Hide/Block actions which leads to suppression. Consider softening controversial elements.</p>
                  </div>
                </div>
              )}

              {/* Detected Templates */}
              {scores.detectedTemplates.length > 0 && (
                <div className="templates-detected">
                  <h4>
                    <CheckCircle size={18} />
                    Research-Backed Templates Detected
                  </h4>
                  <div className="template-tags">
                    {scores.detectedTemplates.map((template, i) => (
                      <span key={i} className="template-tag">
                        Template #{template.number}: {template.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Metrics - Weighted by Research */}
              <div className="metrics-section">
                <h3>Core Metrics (Weighted by Algorithm)</h3>
                <div className="scores-grid">
                  <ScoreCard
                    title="Replies Potential"
                    score={scores.engagement}
                    description="10x weight - Most critical signal"
                    badge="10x"
                    icon={<MessageCircle size={20} />}
                  />
                  <ScoreCard
                    title="Hook Strength"
                    score={scores.hook}
                    description="Stops the scroll"
                    icon={<Target size={20} />}
                  />
                  <ScoreCard
                    title="Conversation Depth"
                    score={scores.conversationDepth}
                    description="Back-and-forth potential"
                    icon={<MessageCircle size={20} />}
                  />
                  <ScoreCard
                    title="Dwell Time"
                    score={scores.readability}
                    description="6x weight - Reading ease"
                    badge="6x"
                    icon={<Eye size={20} />}
                  />
                  <ScoreCard
                    title="Velocity Potential"
                    score={scores.velocityPotential}
                    description="First-hour engagement speed"
                    icon={<Clock size={20} />}
                  />
                  <ScoreCard
                    title="Profile Tap Potential"
                    score={scores.profileTapPotential}
                    description="5x weight - Discovery signal"
                    badge="5x"
                    icon={<Eye size={20} />}
                  />
                </div>
              </div>

              {/* Supporting Metrics */}
              <div className="metrics-section">
                <h3>Supporting Metrics</h3>
                <div className="scores-grid">
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

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <div className="recommendations-section">
                <div className="section-header">
                  <h2>Recommendations</h2>
                  <p className="section-subtitle">
                    Prioritized actions to improve viral potential
                  </p>
                </div>
                
                <div className="recommendations-list">
                  {recommendations.map((rec, i) => (
                    <div key={i} className={`recommendation ${getPriorityClass(rec.priority)}`}>
                      <div className="rec-priority">
                        {getPriorityIcon(rec.priority)}
                        <span className="rec-priority-label">{rec.priority}</span>
                      </div>
                      <div className="rec-content">
                        <div className="rec-category">{rec.category}</div>
                        <div className="rec-action">{rec.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {enhancements && isPremium && (
          <EnhancementPanel
            enhancements={enhancements}
            originalPost={postText}
            onSelect={(text) => setPostText(text)}
          />
        )}
      </div>
    </div>
  );
};

export default PostAnalyzer;