/**
 * Post Analysis Engine
 * Analyzes posts based on various metrics
 */

/**
 * Calculate readability score
 */
export const calculateReadability = (text) => {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllables = words.reduce((acc, word) => {
    return acc + countSyllables(word);
  }, 0) / words.length;

  // Simplified Flesch Reading Ease approximation
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllables);
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Count syllables in a word
 */
const countSyllables = (word) => {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
};

/**
 * Calculate engagement potential
 */
export const calculateEngagementPotential = (text) => {
  let score = 50; // Base score

  // Questions increase engagement
  const questionCount = (text.match(/\?/g) || []).length;
  score += Math.min(questionCount * 5, 20);

  // Hashtags (though Threads uses less)
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  score += Math.min(hashtagCount * 3, 15);

  // Mentions
  const mentionCount = (text.match(/@\w+/g) || []).length;
  score += Math.min(mentionCount * 2, 10);

  // Length optimization (Threads posts perform well at 150-300 chars)
  const length = text.length;
  if (length >= 150 && length <= 300) {
    score += 15;
  } else if (length >= 100 && length <= 500) {
    score += 10;
  }

  // Emojis (moderate use)
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 0 && emojiCount <= 3) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate sentiment score
 */
export const calculateSentiment = (text) => {
  const positiveWords = ['love', 'amazing', 'great', 'awesome', 'best', 'excellent', 'wonderful', 'fantastic', 'happy', 'excited', 'grateful', 'thankful', 'blessed', 'incredible', 'perfect'];
  const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'bad', 'sad', 'angry', 'frustrated', 'disappointed', 'horrible', 'disgusting', 'pathetic'];

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    positiveCount += (lowerText.match(regex) || []).length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    negativeCount += (lowerText.match(regex) || []).length;
  });

  const total = positiveCount + negativeCount;
  if (total === 0) return 50; // Neutral

  const score = (positiveCount / total) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Calculate hook strength
 */
export const calculateHookStrength = (text) => {
  const firstSentence = text.split(/[.!?]/)[0].trim();
  let score = 30; // Base score

  // Questions are good hooks
  if (firstSentence.includes('?')) score += 20;

  // Numbers/statistics
  if (/\d+/.test(firstSentence)) score += 15;

  // Strong opening words
  const strongOpeners = ['here', 'this', 'if', 'when', 'why', 'how', 'what', 'imagine', 'picture', 'think'];
  const firstWord = firstSentence.split(/\s+/)[0].toLowerCase();
  if (strongOpeners.includes(firstWord)) score += 15;

  // Length (short hooks are better)
  if (firstSentence.length <= 50) score += 10;
  else if (firstSentence.length <= 100) score += 5;

  // Emotional words
  const emotionalWords = ['shocked', 'surprised', 'amazed', 'unbelievable', 'incredible', 'wow', 'omg'];
  if (emotionalWords.some(word => firstSentence.toLowerCase().includes(word))) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate CTA quality
 */
export const calculateCTAQuality = (text) => {
  const ctaPatterns = [
    /\b(save|share|comment|like|follow|subscribe|click|visit|check|try|use|download)\b/gi,
    /\b(what do you think|let me know|tell me|share your|drop a|leave a)\b/gi,
    /[!?]\s*$/,
  ];

  let score = 0;
  ctaPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      score += 25;
    }
  });

  // Check if CTA is at the end (more effective)
  const lastSentence = text.split(/[.!?]/).filter(s => s.trim()).pop() || '';
  if (ctaPatterns.some(pattern => pattern.test(lastSentence))) {
    score += 25;
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate visual appeal
 */
export const calculateVisualAppeal = (text) => {
  let score = 50;

  // Line breaks create visual interest
  const lineBreaks = (text.match(/\n/g) || []).length;
  score += Math.min(lineBreaks * 5, 20);

  // Emojis (moderate use)
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount >= 1 && emojiCount <= 5) {
    score += 15;
  }

  // Paragraph structure
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 2 && paragraphs.length <= 4) {
    score += 15;
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate authenticity
 */
export const calculateAuthenticity = (text) => {
  let score = 60; // Base score

  // Personal pronouns
  const personalPronouns = (text.match(/\b(I|me|my|we|us|our)\b/gi) || []).length;
  score += Math.min(personalPronouns * 3, 20);

  // Contractions (more conversational)
  const contractions = (text.match(/\b(I'm|you're|we're|they're|it's|don't|can't|won't|isn't|aren't)\b/gi) || []).length;
  score += Math.min(contractions * 2, 10);

  // Avoid overly promotional language
  const promotionalWords = (text.match(/\b(buy now|limited time|act now|click here|special offer)\b/gi) || []).length;
  score -= promotionalWords * 5;

  // Storytelling elements
  const storyWords = (text.match(/\b(yesterday|today|once|when|then|after|before|story|happened)\b/gi) || []).length;
  score += Math.min(storyWords * 2, 10);

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate viral potential (composite score)
 */
export const calculateViralPotential = (scores) => {
  const weights = {
    engagement: 0.25,
    readability: 0.15,
    sentiment: 0.15,
    hook: 0.20,
    cta: 0.10,
    visual: 0.10,
    authenticity: 0.05
  };

  const weightedScore = 
    scores.engagement * weights.engagement +
    scores.readability * weights.readability +
    scores.sentiment * weights.sentiment +
    scores.hook * weights.hook +
    scores.cta * weights.cta +
    scores.visual * weights.visual +
    scores.authenticity * weights.authenticity;

  return Math.round(weightedScore);
};

/**
 * Analyze post and return all scores
 */
export const analyzePost = (text) => {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const scores = {
    engagement: calculateEngagementPotential(text),
    readability: calculateReadability(text),
    sentiment: calculateSentiment(text),
    hook: calculateHookStrength(text),
    cta: calculateCTAQuality(text),
    visual: calculateVisualAppeal(text),
    authenticity: calculateAuthenticity(text)
  };

  scores.viral = calculateViralPotential(scores);

  return scores;
};
