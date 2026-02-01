import './ScoreCard.css';

const ScoreCard = ({ title, score, description, badge }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--info)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--error)';
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const radius = 25;
  const circumference = 2 * Math.PI * radius;

  return (
    <div 
      className={`score-card ${getScoreClass(score)}`}
      style={{ 
        '--score-color': getScoreColor(score),
        '--score-value': score 
      }}
    >
      <div className="score-header">
        <div className="score-info">
          <h4 className="score-title">{title}</h4>
          {badge && <span className="score-badge">{badge}</span>}
        </div>
        <div className="score-display">
          <svg className="score-ring" viewBox="0 0 60 60">
            <circle
              className="score-ring-bg"
              cx="30"
              cy="30"
              r={radius}
            />
            <circle
              className="score-ring-fill"
              cx="30"
              cy="30"
              r={radius}
            />
          </svg>
          <div className="score-number">{score}</div>
        </div>
      </div>
      <p className="score-description">{description}</p>
      <div className="score-status">{getScoreStatus(score)}</div>
    </div>
  );
};

export default ScoreCard;
