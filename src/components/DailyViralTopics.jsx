import { useEffect, useState } from 'react';
import { Calendar, RefreshCcw, Clipboard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateDailyTopics } from '../services/topicEngine';
import { getReferenceData } from '../services/firebaseService';
import { getOwnerUid, isOwner } from '../utils/owner';
import './DailyViralTopics.css';

const DailyViralTopics = ({ user }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTopics = async ({ forceRefresh = false } = {}) => {
    setRefreshing(forceRefresh);
    setLoading(!forceRefresh);
    try {
      const refUid = isOwner(user) ? user.uid : getOwnerUid() || user.uid;
      const referenceData = await getReferenceData(refUid);
      const viralPosts = referenceData
        .filter((ref) => ref && ref.type === 'viral_post' && ref.postText)
        .map((ref) => ref.postText);

      const dailyTopics = generateDailyTopics({ viralPosts, forceRefresh });
      setTopics(dailyTopics);
    } catch (error) {
      toast.error('Unable to load daily viral topics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTopics();
    }
  }, [user?.uid]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Topic copied to clipboard');
    } catch (error) {
      toast.error('Unable to copy topic');
    }
  };

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="daily-topics">
      <div className="card daily-topics-card">
        <div className="card-header daily-topics-header">
          <div>
            <h2 className="card-title">Today&apos;s Viral Topics</h2>
            <p className="card-subtitle">
              Proven frameworks filtered through your viral history.
            </p>
          </div>
          <div className="daily-topics-meta">
            <span className="daily-date">
              <Calendar size={16} />
              {todayLabel}
            </span>
            <button
              type="button"
              onClick={() => loadTopics({ forceRefresh: true })}
              className="btn btn-secondary btn-refresh"
              disabled={refreshing}
            >
              <RefreshCcw size={16} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="daily-topics-loading">Generating today&apos;s topics...</div>
          ) : (
            <div className="daily-topics-list">
              {topics.map((topic, index) => (
                <div key={topic.id} className="daily-topic-item">
                  <div className="daily-topic-rank">{index + 1}</div>
                  <div className="daily-topic-content">
                    <div className="daily-topic-text">{topic.text}</div>
                    <div className="daily-topic-tags">
                      <span className="tag">Format: {topic.tags.format}</span>
                      <span className="tag">Emotion: {topic.tags.emotion}</span>
                      <span className="tag">Difficulty: {topic.tags.difficulty}</span>
                      <span className="tag">Score: {topic.score}/10</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-copy"
                    onClick={() => handleCopy(topic.text)}
                    aria-label="Copy topic"
                  >
                    <Clipboard size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card daily-topics-card">
        <div className="card-header">
          <h3 className="card-title">How this works</h3>
          <p className="card-subtitle">
            We analyze your viral database, expand proven frameworks, and filter by predicted score.
          </p>
        </div>
        <div className="card-body">
          <div className="daily-topics-steps">
            <div>
              <h4>1. Framework Library</h4>
              <p>Extracts archetypes from your historical viral posts.</p>
            </div>
            <div>
              <h4>2. Topic Expansion</h4>
              <p>Creates fresh variations without random fluff.</p>
            </div>
            <div>
              <h4>3. Quality Filter</h4>
              <p>Only keeps topics that score above the viral threshold.</p>
            </div>
            <div>
              <h4>4. Daily Rotation</h4>
              <p>Rotates ideas so you never see repeats.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyViralTopics;
