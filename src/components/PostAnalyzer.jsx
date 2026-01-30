import { useState } from 'react';
import { analyzePost } from '../services/analysisEngine';
import { analyzePostWithContext, enhancePostWithContext } from '../services/geminiService';
import { getReferenceData } from '../services/firebaseService';
import { saveAnalysisResult } from '../services/firebaseService';
import { toast } from 'react-hot-toast';
import ScoreCard from './ScoreCard';
import EnhancementPanel from './EnhancementPanel';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';
import './PostAnalyzer.css';

const PostAnalyzer = ({ user, isPremium }) => {
  const [postText, setPostText] = useState('');
  const [scores, setScores] = useState(null);
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
      // Basic analysis only (user-facing)
      const basicScores = analyzePost(postText);
      setScores(basicScores);

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
        .slice(0, 10); // Limit to 10 most recent

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

  return (
    <div className="post-analyzer">
      <div className="analyzer-container">
        <div className="input-section">
          <div className="section-header">
            <h2>Analyze Your Post</h2>
            <p className="section-subtitle">
              Paste or type your Threads post below
            </p>
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
          <div className="results-section">
            <div className="section-header">
              <h2>Analysis Results</h2>
              <div className="overall-score">
                <div className="score-value">{scores.viral}</div>
                <div className="score-label">Viral Score</div>
              </div>
            </div>

            <div className="scores-grid">
              <ScoreCard
                title="Engagement Potential"
                score={scores.engagement}
                description="Likelihood to generate likes, comments, and shares"
              />
              <ScoreCard
                title="Readability"
                score={scores.readability}
                description="How easy it is to read and understand"
              />
              <ScoreCard
                title="Sentiment"
                score={scores.sentiment}
                description="Positive sentiment score"
              />
              <ScoreCard
                title="Hook Strength"
                score={scores.hook}
                description="How compelling the opening is"
              />
              <ScoreCard
                title="CTA Quality"
                score={scores.cta}
                description="Clarity and effectiveness of call-to-action"
              />
              <ScoreCard
                title="Visual Appeal"
                score={scores.visual}
                description="Text structure and visual interest"
              />
              <ScoreCard
                title="Authenticity"
                score={scores.authenticity}
                description="How genuine and authentic it sounds"
              />
            </div>

          </div>
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
