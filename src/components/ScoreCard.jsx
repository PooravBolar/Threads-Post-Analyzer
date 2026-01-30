import './ScoreCard.css';

const ScoreCard = ({ title, score, description }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success-color)';
    if (score >= 60) return '#ffa500';
    return '#ff4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="score-card">
      <div className="score-header">
        <h3 className="score-title">{title}</h3>
        <div
          className="score-circle"
          style={{ '--score-color': getScoreColor(score) }}
        >
          <span className="score-number">{score}</span>
        </div>
      </div>
      <p className="score-description">{description}</p>
      <div className="score-label">{getScoreLabel(score)}</div>
    </div>
  );
};

export default ScoreCard;
