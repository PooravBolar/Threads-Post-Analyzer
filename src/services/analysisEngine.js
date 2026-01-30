/**
 * Post Analysis Engine - Complete Research Implementation
 * Every metric from "The Threads Protocol" paper
 */

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
 * Calculate readability score (Flesch Reading Ease)
 * Paper: Dwell Time = 6x weight
 */
export const calculateReadability = (text) => {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0 || words.length === 0) return 50;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllables = words.reduce((acc, word) => {
    return acc + countSyllables(word);
  }, 0) / words.length;

  // Flesch Reading Ease: 206.835 - (1.015 * ASL) - (84.6 * ASW)
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllables);
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Calculate engagement potential
 * Paper: Replies = 10x (CRITICAL), Reposts = 8x (HIGH)
 */
export const calculateEngagementPotential = (text) => {
  let score = 30;

  // REPLIES (10x weight - most critical signal)
  const questionCount = (text.match(/\?/g) || []).length;
  score += Math.min(questionCount * 15, 40);

  // Ego-bait patterns (Template 11-15)
  const egoBaitPatterns = [
    /what('s| is) your/gi,
    /how do you/gi,
    /tell me|let me know/gi,
    /share your/gi,
    /drop a/gi,
    /leave a/gi,
    /thoughts\?/gi,
  ];
  const hasEgoBait = egoBaitPatterns.some(p => p.test(text));
  if (hasEgoBait) score += 20;

  // Binary choice (Template 12)
  if (/team \w+ or team|\bor\b.*\?/gi.test(text)) score += 15;

  // Fill-in-blank / Unpopular opinion (Template 13)
  if (/unpopular opinion|hot take|am i wrong/gi.test(text)) score += 15;

  // Tag-a-friend (Template 15 - use carefully)
  if (/tag (a |someone)/gi.test(text)) score += 10;

  // REPOSTS (8x weight - shareability)
  const length = text.length;
  
  // "Digital bumper sticker" (under 100 chars)
  if (length < 100 && length > 20) score += 15;

  // Optimal length: 150-300 chars (research sweet spot)
  if (length >= 150 && length <= 300) score += 12;
  else if (length >= 100 && length <= 500) score += 6;

  // Long-form triggers "See More" (micro-conversion)
  if (length > 300) score += 8;

  // SEMANTIC KEYWORDS (not hashtags)
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  if (hashtagCount === 1) score += 5; // Single relevant tag optimal
  else if (hashtagCount === 2) score += 3;
  else if (hashtagCount > 5) score -= 20; // MAJOR PENALTY: spam filter

  // Mentions (moderate value)
  const mentionCount = (text.match(/@\w+/g) || []).length;
  score += Math.min(mentionCount * 2, 8);

  // Emojis: 1-3 optimal, 5+ penalty
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount >= 1 && emojiCount <= 3) score += 10;
  else if (emojiCount > 5) score -= 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate sentiment score
 * Paper: Positive sentiment correlates with shares
 */
export const calculateSentiment = (text) => {
  const positiveWords = [
    'love', 'amazing', 'great', 'awesome', 'best', 'excellent', 
    'wonderful', 'fantastic', 'happy', 'excited', 'grateful', 
    'thankful', 'blessed', 'incredible', 'perfect', 'proud', 
    'win', 'success', 'beautiful', 'brilliant', 'outstanding'
  ];
  
  const negativeWords = [
    'hate', 'terrible', 'awful', 'worst', 'bad', 'sad', 
    'angry', 'frustrated', 'disappointed', 'horrible', 
    'disgusting', 'pathetic', 'fail', 'lost', 'failure', 
    'mistake', 'wrong', 'broken'
  ];

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
  if (total === 0) return 50;

  const score = (positiveCount / total) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Calculate hook strength
 * Paper: First sentence critical for stopping scroll
 * Templates 1-5 focus on hooks
 */
export const calculateHookStrength = (text) => {
  const firstSentence = text.split(/[.!?\n]/)[0].trim();
  let score = 20;

  // Questions (pattern interrupt)
  if (firstSentence.includes('?')) score += 25;

  // Numbers/Statistics (Template 4)
  if (/\d+/.test(firstSentence)) score += 20;

  // Template 1: Negative Outcome Hook
  if (/^stop (doing|using)/i.test(firstSentence)) score += 25;

  // Template 2: Hard Truth Hook
  if (/(is a lie|is wrong|is overrated)/i.test(firstSentence)) score += 20;

  // Template 5: Curiosity Gap
  if (/^i (finally|just|recently)/i.test(firstSentence)) score += 20;

  // Strong opening words (research-validated)
  const strongOpeners = [
    /^(here|this|if|when|why|how|what)/i,
    /^imagine|picture|think/i,
    /^unpopular opinion/i,
  ];
  if (strongOpeners.some(p => p.test(firstSentence))) score += 15;

  // Negative outcome words (Template 1)
  if (/killing|hurting|ruining|destroying|damaging/i.test(firstSentence)) score += 15;

  // Short hooks (under 50 chars)
  if (firstSentence.length <= 50) score += 15;
  else if (firstSentence.length <= 100) score += 8;

  // Emotional trigger words
  const emotionalWords = [
    'shocked', 'surprised', 'amazed', 'unbelievable', 
    'incredible', 'wow', 'omg', 'finally', 'truth'
  ];
  if (emotionalWords.some(w => firstSentence.toLowerCase().includes(w))) score += 10;

  // Curiosity gap (ellipsis)
  if (/\.\.\.|…/.test(firstSentence)) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate CTA quality
 * Paper: CTAs at end more effective, but engagement bait penalized
 */
export const calculateCTAQuality = (text) => {
  const ctaPatterns = [
    /\b(comment|reply|share|tell me|let me know)\b/gi,
    /\b(what do you think|drop a|leave a)\b/gi,
    /\b(tag (a |someone)|thoughts\?)/gi,
    /\b(team \w+ or team)/gi,
  ];

  let score = 0;

  // Check for any CTA
  ctaPatterns.forEach(pattern => {
    if (pattern.test(text)) score += 20;
  });

  // CTA at end (more effective)
  const lastSentence = text.split(/[.!?]/).filter(s => s.trim()).pop() || '';
  if (ctaPatterns.some(pattern => pattern.test(lastSentence))) score += 30;

  // Question at end = implicit CTA
  if (text.trim().endsWith('?')) score += 25;

  // PENALTY: Engagement bait (spam filter)
  const engagementBait = /\b(like this|save this|share if you agree|comment below|drop a like)\b/gi;
  if (engagementBait.test(text)) score -= 40;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate visual appeal
 * Paper: Line breaks = visual interest, each worth ~5 points
 */
export const calculateVisualAppeal = (text) => {
  let score = 40;

  // Line breaks (critical for dwell time)
  const lineBreaks = (text.match(/\n/g) || []).length;
  score += Math.min(lineBreaks * 5, 25);

  // Emojis: 1-5 optimal
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount >= 1 && emojiCount <= 5) score += 15;
  else if (emojiCount > 8) score -= 10;

  // Paragraph structure (2-4 optimal)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 2 && paragraphs.length <= 4) score += 20;
  else if (paragraphs.length > 6) score -= 10;

  // White space (prevents wall of text)
  const hasWhiteSpace = text.includes('\n\n') || text.includes('\n');
  if (hasWhiteSpace) score += 10;

  // PENALTY: Wall of text
  if (text.length > 500 && lineBreaks === 0) score -= 25;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate authenticity
 * Paper: Personal pronouns + contractions = conversational tone
 * Template 7 (Vulnerability) scores high
 */
export const calculateAuthenticity = (text) => {
  let score = 50;

  // Personal pronouns
  const personalPronouns = (text.match(/\b(I|me|my|we|us|our)\b/gi) || []).length;
  score += Math.min(personalPronouns * 4, 25);

  // Contractions (conversational)
  const contractions = (text.match(/\b(I'm|you're|we're|they're|it's|don't|can't|won't|isn't|aren't|haven't|hasn't|didn't|doesn't)\b/gi) || []).length;
  score += Math.min(contractions * 3, 15);

  // PENALTY: Promotional language
  const promotionalWords = (text.match(/\b(buy now|limited time|act now|click here|special offer|discount|sale)\b/gi) || []).length;
  score -= promotionalWords * 10;

  // Storytelling elements (Template 6, 7, 8)
  const storyWords = (text.match(/\b(yesterday|today|last week|once|when|then|after|before|story|happened|learned|realized)\b/gi) || []).length;
  score += Math.min(storyWords * 3, 15);

  // Vulnerability signals (Template 7)
  const vulnerabilityPatterns = [
    /\b(failed|messed up|struggled|mistake|learned|wrong)\b/gi,
  ];
  const hasVulnerability = vulnerabilityPatterns.some(p => p.test(text));
  if (hasVulnerability) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate conversation depth potential
 * Paper: "Back-and-forth dialogue weighted higher than flat comments"
 */
export const calculateConversationDepth = (text) => {
  let score = 40;

  // Open-ended questions (how, why, what)
  const openQuestions = (text.match(/\b(how|why|what|when|where|which)\b.*\?/gi) || []).length;
  score += Math.min(openQuestions * 15, 35);

  // Personal questions (ego-driven)
  const personalPatterns = [
    /your (favorite|biggest|best|worst)/gi,
    /do you (prefer|think|use|have)/gi,
    /what('s| is) your/gi,
  ];
  const hasPersonalQuestion = personalPatterns.some(p => p.test(text));
  if (hasPersonalQuestion) score += 25;

  // Multiple questions
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount >= 2) score += 15;

  // Controversial takes (drives debate)
  if (/unpopular opinion|hot take|am i (wrong|alone)/gi.test(text)) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate velocity potential (first-hour engagement)
 * Paper: "Speed of interaction within first 15-60 minutes is crucial"
 * "Golden Window" - 10 replies in 10 min > 10 replies in 10 hours
 */
export const calculateVelocityPotential = (text) => {
  let score = 50;

  // Binary choice (low friction)
  const binaryPatterns = [
    /\bor\b/gi,
    /team \w+/gi,
    /agree or disagree/gi,
  ];
  const hasBinaryChoice = binaryPatterns.some(p => p.test(text));
  if (hasBinaryChoice) score += 20;

  // Quick read (fast consumption)
  const wordCount = text.split(/\s+/).length;
  if (wordCount <= 50) score += 15;
  else if (wordCount <= 150) score += 10;

  // Emotional trigger (immediate reaction)
  const emotionalTriggers = [
    /shocked|surprised|can't believe/gi,
    /unpopular opinion|hot take/gi,
    /just (realized|found|learned)/gi,
  ];
  const hasEmotionalTrigger = emotionalTriggers.some(p => p.test(text));
  if (hasEmotionalTrigger) score += 15;

  // Direct question
  if (text.includes('?')) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Detect suppression triggers
 * Paper Section 2.3: Safety Layer
 */
export const detectSuppressionRisks = (text) => {
  const risks = [];
  let riskScore = 0;

  // 1. Engagement bait (explicit penalty)
  if (/\b(like this|save this|share if|comment below|drop a like)\b/gi.test(text)) {
    risks.push("Engagement bait detected - triggers spam filters");
    riskScore += 30;
  }

  // 2. Excessive hashtags (>5 = spam)
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  if (hashtagCount > 5) {
    risks.push(`Too many hashtags (${hashtagCount}) - use 1-2 max`);
    riskScore += 20;
  }

  // 3. External links in body (deprioritized)
  if (/https?:\/\//i.test(text)) {
    risks.push("External link in post body - put in comments instead");
    riskScore += 15;
  }

  // 4. Promotional language
  if (/\b(buy now|limited time|act now|sale|discount|click here)\b/gi.test(text)) {
    risks.push("Promotional language detected - damages authenticity");
    riskScore += 25;
  }

  // 5. Wall of text (no breaks)
  const hasLineBreaks = text.includes('\n');
  if (text.length > 400 && !hasLineBreaks) {
    risks.push("Wall of text - add line breaks for readability");
    riskScore += 15;
  }

  // 6. Generic/recycled content
  if (/\b(good morning|happy (monday|tuesday|wednesday|thursday|friday)|have a great day)\b/gi.test(text)) {
    risks.push("Generic greeting detected - may be flagged as low-quality");
    riskScore += 10;
  }

  // 7. Rapid-fire posting indicator (if same text recycled)
  // Note: This can't be detected from single post, but flag identical text
  
  return {
    risks,
    riskScore: Math.min(100, riskScore),
    safe: riskScore < 20
  };
};

/**
 * Calculate relationship signal strength
 * Paper: "System prioritizes content from accounts user has interacted with"
 * Note: This is context-dependent, but we can score potential
 */
export const calculateRelationshipPotential = (text) => {
  let score = 50;

  // Mentions (direct relationship signal)
  const mentionCount = (text.match(/@\w+/g) || []).length;
  score += Math.min(mentionCount * 10, 30);

  // Reply context indicators (suggests it's part of conversation)
  if (/^@\w+/i.test(text.trim())) score += 20;

  return Math.max(0, Math.min(100, score));
};

/**
 * Detect "rage bait" patterns
 * Paper: "Content that receives high volume of replies but also high Hide/Block is suppressed"
 */
export const detectRageBait = (text) => {
  let rageBaitScore = 0;

  // Extreme controversial positions (not just contrarian)
  const extremePatterns = [
    /\b(hate|destroy|kill|attack)\b/gi,
    /\b(idiots|stupid people|morons)\b/gi,
  ];
  extremePatterns.forEach(pattern => {
    if (pattern.test(text)) rageBaitScore += 20;
  });

  // Political trigger words (high hide/block risk)
  const politicalTriggers = text.match(/\b(trump|biden|democrat|republican|liberal|conservative)\b/gi) || [];
  if (politicalTriggers.length > 2) rageBaitScore += 15;

  // Inflammatory generalizations
  if (/\b(all|every|always|never)\b.*\b(people|men|women)\b/gi.test(text)) {
    rageBaitScore += 10;
  }

  return {
    isRageBait: rageBaitScore > 30,
    rageBaitScore: Math.min(100, rageBaitScore)
  };
};

/**
 * Calculate profile tap potential
 * Paper: Profile taps = 5x weight (Discovery-to-follow pipeline)
 */
export const calculateProfileTapPotential = (text) => {
  let score = 50;

  // Authority signals (makes people want to know more)
  const authorityPatterns = [
    /i (built|created|grew|made)/gi,
    /my (company|startup|business|team)/gi,
    /\d+ (years|months) (of )?experience/gi,
  ];
  const hasAuthority = authorityPatterns.some(p => p.test(text));
  if (hasAuthority) score += 20;

  // Expertise signals
  if (/i (tested|analyzed|researched|studied)/gi.test(text)) score += 15;

  // Results/credibility
  if (/\$\d+|[\d,]+%|\d+x/gi.test(text)) score += 15;

  // Unique perspective
  if (/unpopular opinion|hot take|here's what (nobody|no one) tells you/gi.test(text)) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Analyze "See More" expansion potential
 * Paper: Long posts with "See More" trigger micro-conversion
 */
export const calculateSeeMorePotential = (text) => {
  const length = text.length;
  let score = 0;

  // "See More" typically triggers around 280 chars
  if (length > 280 && length <= 800) {
    score = 75; // Sweet spot for expansion
  } else if (length > 800 && length <= 1500) {
    score = 60; // Good, but may be too long
  } else if (length > 1500) {
    score = 40; // Very long, needs strong hook
  } else {
    score = 20; // Too short for "See More"
  }

  // Hook quality matters more for long posts
  const firstSentence = text.split(/[.!?\n]/)[0];
  if (length > 280 && firstSentence.length > 100) {
    score -= 15; // Slow hook on long post
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate "saves" potential
 * Paper: High-value content gets saved for reference (Template 10: Resource Drop)
 */
export const calculateSavesPotential = (text) => {
  let score = 30;

  // List format (Template 10)
  const listPatterns = [
    /\d+\s+(ways|tips|tools|resources|steps|reasons)/gi,
    /^[-•]\s/gm,
    /^\d+\.\s/gm,
  ];
  const hasList = listPatterns.some(p => p.test(text));
  if (hasList) score += 25;

  // Educational/tutorial language (Template 8)
  if (/\b(how to|step by step|guide|tutorial)\b/gi.test(text)) score += 20;

  // Resource compilation (Template 10)
  if (/\b(best|top) \d+ (tools|resources|apps|sites)/gi.test(text)) score += 20;

  // Reference value keywords
  if (/\b(framework|template|checklist|cheatsheet)\b/gi.test(text)) score += 15;

  return Math.max(0, Math.min(100, score));
};

/**
 * Detect template usage from research (Templates 1-20)
 */
export const detectTemplate = (text) => {
  const templates = [];

  // Template 1: Negative Outcome Hook
  if (/stop (doing|using).*killing|hurting|ruining/gi.test(text)) {
    templates.push({ number: 1, name: 'Negative Outcome Hook' });
  }

  // Template 2: Hard Truth Hook
  if (/(is a lie|is wrong|is overrated).*here is/gi.test(text)) {
    templates.push({ number: 2, name: 'Hard Truth Hook' });
  }

  // Template 3: Time Frame Case Study
  if (/how i (went|grew|built|made).*in \d+ (days|weeks|months)/gi.test(text)) {
    templates.push({ number: 3, name: 'Time Frame Case Study' });
  }

  // Template 4: Specific Number List
  if (/\d+ (ways|tips|tools).*number \d+/gi.test(text)) {
    templates.push({ number: 4, name: 'Specific Number List' });
  }

  // Template 5: Curiosity Gap
  if (/i finally figured out why/gi.test(text)) {
    templates.push({ number: 5, name: 'Curiosity Gap' });
  }

  // Template 6: Before & After
  if (/old me:.*new me:/gi.test(text)) {
    templates.push({ number: 6, name: 'Before & After Narrative' });
  }

  // Template 7: Teachable Moment
  if (/i messed up.*here is what i learned/gi.test(text)) {
    templates.push({ number: 7, name: 'Teachable Moment' });
  }

  // Template 8: Step-by-Step
  if (/step \d+:.*step \d+:/gi.test(text)) {
    templates.push({ number: 8, name: 'Step-by-Step Tutorial' });
  }

  // Template 9: Contrarian Explanation
  if (/everyone says.*but actually/gi.test(text)) {
    templates.push({ number: 9, name: 'Contrarian Explanation' });
  }

  // Template 10: Resource Drop
  if (/i spent.*collecting.*here are the top/gi.test(text)) {
    templates.push({ number: 10, name: 'Resource Drop' });
  }

  // Template 11: Ego Bait Question
  if (/what is your (biggest|favorite|best).*\?/gi.test(text)) {
    templates.push({ number: 11, name: 'Ego Bait Question' });
  }

  // Template 12: Binary Choice
  if (/team \w+ or team.*\?/gi.test(text)) {
    templates.push({ number: 12, name: 'Binary Choice' });
  }

  // Template 13: Fill in the Blank
  if (/unpopular opinion:.*is overrated/gi.test(text)) {
    templates.push({ number: 13, name: 'Fill in the Blank' });
  }

  // Template 14: Advice Seek
  if (/i'm struggling with.*how do you/gi.test(text)) {
    templates.push({ number: 14, name: 'Advice Seek' });
  }

  // Template 15: Tag a Friend
  if (/tag (a|someone) (who|friend)/gi.test(text)) {
    templates.push({ number: 15, name: 'Tag a Friend' });
  }

  return templates;
};

/**
 * Calculate viral potential with research-based weights
 * Paper Section 2.2: Ranking Signals & Weights
 */
export const calculateViralPotential = (scores) => {
  // Research weights:
  // Replies (10x), Reposts (8x), Dwell Time (6x), Profile Taps (5x), Likes (3x)
  
  const weights = {
    engagement: 0.30,           // Replies = 10x
    hook: 0.20,                 // Stops scroll
    conversationDepth: 0.15,    // Back-and-forth potential
    readability: 0.10,          // Dwell time = 6x
    velocityPotential: 0.10,    // First-hour critical
    visual: 0.05,              // Supporting
    cta: 0.05,                 // Supporting
    authenticity: 0.05,        // Supporting
  };

  const weightedScore = 
    scores.engagement * weights.engagement +
    scores.hook * weights.hook +
    scores.conversationDepth * weights.conversationDepth +
    scores.readability * weights.readability +
    scores.velocityPotential * weights.velocityPotential +
    scores.visual * weights.visual +
    scores.cta * weights.cta +
    scores.authenticity * weights.authenticity;

  // Apply suppression penalty
  const suppressionPenalty = scores.suppressionRisk.riskScore * 0.3;

  // Apply rage bait penalty
  const rageBaitPenalty = scores.rageBait.rageBaitScore * 0.2;

  return Math.max(0, Math.round(weightedScore - suppressionPenalty - rageBaitPenalty));
};

/**
 * Analyze post - complete analysis with all metrics
 */
export const analyzePost = (text) => {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const scores = {
    // Original metrics
    engagement: calculateEngagementPotential(text),
    readability: calculateReadability(text),
    sentiment: calculateSentiment(text),
    hook: calculateHookStrength(text),
    cta: calculateCTAQuality(text),
    visual: calculateVisualAppeal(text),
    authenticity: calculateAuthenticity(text),
    
    // New research-based metrics
    conversationDepth: calculateConversationDepth(text),
    velocityPotential: calculateVelocityPotential(text),
    relationshipPotential: calculateRelationshipPotential(text),
    profileTapPotential: calculateProfileTapPotential(text),
    seeMorePotential: calculateSeeMorePotential(text),
    savesPotential: calculateSavesPotential(text),
    
    // Safety/risk metrics
    suppressionRisk: detectSuppressionRisks(text),
    rageBait: detectRageBait(text),
    
    // Template detection
    detectedTemplates: detectTemplate(text),
  };

  scores.viral = calculateViralPotential(scores);

  return scores;
};

/**
 * Generate recommendations based on analysis
 */
export const generateRecommendations = (scores, text) => {
  const recommendations = [];

  // CRITICAL: Suppression risks
  if (!scores.suppressionRisk.safe) {
    scores.suppressionRisk.risks.forEach(risk => {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Safety',
        action: risk
      });
    });
  }

  // CRITICAL: Rage bait detection
  if (scores.rageBait.isRageBait) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Safety',
      action: 'Rage bait detected - high risk of Hide/Block actions leading to suppression'
    });
  }

  // HIGH: Reply optimization (10x weight)
  if (scores.engagement < 60) {
    if (!(text.includes('?'))) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Replies (10x)',
        action: 'Add a question to trigger replies - most critical ranking signal'
      });
    }
    if (scores.conversationDepth < 50) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Replies (10x)',
        action: 'Use ego-bait: "What\'s your [experience]?" or "Team X or Team Y?"'
      });
    }
  }

  // HIGH: Hook optimization
  if (scores.hook < 60) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Hook',
      action: 'Strengthen opening: Use numbers, questions, or "Stop doing X" pattern'
    });
  }

  // MEDIUM: Dwell time optimization (6x weight)
  if (scores.visual < 60) {
    const lineBreaks = (text.match(/\n/g) || []).length;
    if (lineBreaks < 2) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Dwell Time (6x)',
        action: 'Add line breaks - each break = +5 points (up to 25 points)'
      });
    }
  }

  // MEDIUM: Velocity optimization
  if (scores.velocityPotential < 60) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Velocity',
      action: 'Simplify for quick engagement - binary choice or simple question'
    });
  }

  // MEDIUM: Profile tap potential (5x weight)
  if (scores.profileTapPotential < 50) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Profile Taps (5x)',
      action: 'Add authority signals: results, expertise, or unique perspective'
    });
  }

  // LOW: Length optimization
  const length = text.length;
  if (length < 100) {
    recommendations.push({
      priority: 'LOW',
      category: 'Length',
      action: 'Consider expanding to 150-300 chars for optimal engagement'
    });
  } else if (length > 500 && scores.hook < 70) {
    recommendations.push({
      priority: 'LOW',
      category: 'Length',
      action: 'Long post needs stronger hook to justify read time'
    });
  }

  // LOW: CTA optimization
  if (scores.cta < 40) {
    recommendations.push({
      priority: 'LOW',
      category: 'CTA',
      action: 'Add call-to-action at end: "What do you think?" or "Share your [X]"'
    });
  }

  // Template suggestions
  if (scores.detectedTemplates.length === 0 && scores.viral < 60) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Templates',
      action: 'Consider using research-backed template (11: Ego Bait, 12: Binary Choice, or 4: Number List)'
    });
  }

  return recommendations;
};