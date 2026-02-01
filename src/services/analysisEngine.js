/**
 * Post Analysis Engine - Research-Validated Implementation
 * Based on "The Threads Protocol: An Engineering-Grade Analysis"
 * 
 * All weights and metrics derived from confirmed engineering documentation
 * and observed patterns from Meta's Threads algorithm (2025)
 */

/**
 * Count syllables in a word (for readability calculation)
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
 * Paper: Dwell Time = 6x weight - readability affects time spent
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
  
  // Paper notes: 5th grader readability is optimal for broad reach
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Calculate engagement potential
 * Paper: Replies = 10x (MOST CRITICAL), Reposts = 8x (HIGH)
 * Focus on conversation-driving elements
 */
export const calculateEngagementPotential = (text) => {
  let score = 20; // Lower baseline - engagement must be earned

  // REPLIES (10x weight - THE most critical signal)
  const questionCount = (text.match(/\?/g) || []).length;
  score += Math.min(questionCount * 20, 50); // Increased from 15 to 20
  
  // Open-ended questions (how, why, what) - drive deeper replies
  const openQuestions = (text.match(/\b(how|why|what|when|where|which)\b.*\?/gi) || []).length;
  score += Math.min(openQuestions * 10, 30);

  // Ego-bait patterns (Templates 11-15) - proven reply drivers
  const egoBaitPatterns = [
    /what('s| is) your (favorite|biggest|best|worst)/gi,
    /how do you (handle|deal|approach)/gi,
    /tell me|let me know/gi,
    /share your (experience|thoughts|take)/gi,
    /drop a (comment|reply)/gi,
    /what (do you|would you) think/gi,
  ];
  const egoBaitCount = egoBaitPatterns.filter(p => p.test(text)).length;
  score += Math.min(egoBaitCount * 15, 35);

  // Binary choice (Template 12) - low friction, high reply rate
  if (/team \w+ or team|\b(or|vs\.?)\b.*\?/gi.test(text)) score += 20;

  // Controversial/debate triggers (Template 9, 13)
  const controversialPatterns = [
    /unpopular opinion/gi,
    /hot take/gi,
    /am i (wrong|alone|the only one)/gi,
    /everyone says.*but actually/gi,
    /(is a lie|is wrong|is overrated)/gi,
  ];
  if (controversialPatterns.some(p => p.test(text))) score += 20;

  // Tag-a-friend (Template 15 - use carefully, notification velocity)
  if (/tag (a |someone who)/gi.test(text)) score += 12;

  // REPOSTS (8x weight - shareability/identity signaling)
  const length = text.length;
  
  // "Digital bumper sticker" (under 100 chars) - highest repost rate
  if (length > 20 && length < 100) score += 20; // Increased from 15
  
  // Optimal length: 150-300 chars (research sweet spot)
  if (length >= 150 && length <= 300) score += 15; // Increased from 12
  else if (length >= 100 && length < 500) score += 8;

  // SEMANTIC KEYWORDS (Paper: natural language, not hashtag stuffing)
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  if (hashtagCount === 1) score += 8; // Single relevant tag optimal
  else if (hashtagCount === 2) score += 5;
  else if (hashtagCount > 5) score -= 30; // MAJOR PENALTY: spam filter trigger

  // Mentions (moderate value, relationship signal)
  const mentionCount = (text.match(/@\w+/g) || []).length;
  score += Math.min(mentionCount * 3, 10);

  // Emojis: 1-3 optimal (visual interest), 5+ penalty
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount >= 1 && emojiCount <= 3) score += 12;
  else if (emojiCount >= 4 && emojiCount <= 5) score += 5;
  else if (emojiCount > 5) score -= 15; // Visual spam

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate sentiment score
 * Paper: Positive sentiment correlates with shares and saves
 */
export const calculateSentiment = (text) => {
  const positiveWords = [
    'love', 'amazing', 'great', 'awesome', 'best', 'excellent', 
    'wonderful', 'fantastic', 'happy', 'excited', 'grateful', 
    'thankful', 'blessed', 'incredible', 'perfect', 'proud', 
    'win', 'success', 'beautiful', 'brilliant', 'outstanding',
    'celebrate', 'achieved', 'thrilled', 'joy', 'delighted'
  ];
  
  const negativeWords = [
    'hate', 'terrible', 'awful', 'worst', 'bad', 'sad', 
    'angry', 'frustrated', 'disappointed', 'horrible', 
    'disgusting', 'pathetic', 'fail', 'lost', 'failure', 
    'mistake', 'wrong', 'broken', 'disaster', 'nightmare'
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
  if (total === 0) return 50; // Neutral

  const score = (positiveCount / total) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Calculate hook strength
 * Paper: "First sentence critical for stopping scroll"
 * Templates 1-5 focus on pattern-interrupt hooks
 */
export const calculateHookStrength = (text) => {
  const firstSentence = text.split(/[.!?\n]/)[0].trim();
  let score = 15; // Lower baseline

  // Template 1: Negative Outcome Hook - "Stop doing X. It's killing Y"
  if (/^stop (doing|using)/i.test(firstSentence)) score += 30;
  if (/killing|hurting|ruining|destroying|damaging/i.test(firstSentence)) score += 15;

  // Template 2: Hard Truth Hook - "X is a lie"
  if (/(is a lie|is wrong|is overrated|is dead)/i.test(firstSentence)) score += 25;

  // Template 3: Time Frame Case Study - "How I went from X to Y in Z days"
  if (/how i (went|grew|built|made).*in \d+ (days|weeks|months)/gi.test(firstSentence)) score += 25;

  // Template 4: Numbers/Statistics - concrete data
  if (/\d+/.test(firstSentence)) score += 20;

  // Template 5: Curiosity Gap - "I finally figured out why"
  if (/^i (finally|just|recently) (figured out|learned|discovered)/i.test(firstSentence)) score += 25;

  // Questions (pattern interrupt)
  if (firstSentence.includes('?')) score += 20;

  // Strong opening words (research-validated attention grabbers)
  const strongOpeners = [
    /^(here's|this is|if you|when you|why most|what if)/i,
    /^imagine|picture this|think about/i,
    /^unpopular opinion/i,
    /^nobody (talks|tells you)/i,
  ];
  if (strongOpeners.some(p => p.test(firstSentence))) score += 15;

  // Short, punchy hooks (under 50 chars = digital bumper sticker)
  if (firstSentence.length > 0 && firstSentence.length <= 50) score += 20;
  else if (firstSentence.length <= 100) score += 10;
  else if (firstSentence.length > 150) score -= 10; // Too slow

  // Emotional trigger words (immediate reaction)
  const emotionalWords = [
    'shocked', 'surprised', 'amazed', 'unbelievable', 'can\'t believe',
    'incredible', 'wow', 'finally', 'truth', 'secret', 'nobody tells you'
  ];
  if (emotionalWords.some(w => firstSentence.toLowerCase().includes(w))) score += 15;

  // Curiosity gap indicators (ellipsis, incomplete thought)
  if (/\.\.\.|…/.test(firstSentence)) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate CTA quality
 * Paper: "CTAs at end more effective, but engagement bait penalized"
 */
export const calculateCTAQuality = (text) => {
  const ctaPatterns = [
    /\b(comment|reply|share your|tell me|let me know)\b/gi,
    /\b(what do you think|thoughts\?|your take\?)/gi,
    /\b(drop a (comment|reply)|leave a comment)/gi,
  ];

  let score = 0;

  // Check for any CTA presence
  const ctaCount = ctaPatterns.filter(pattern => pattern.test(text)).length;
  score += Math.min(ctaCount * 15, 30);

  // CTA at end (Paper: more effective placement)
  const sentences = text.split(/[.!?]/).filter(s => s.trim());
  const lastSentence = sentences[sentences.length - 1] || '';
  if (ctaPatterns.some(pattern => pattern.test(lastSentence))) score += 35;

  // Question at end = implicit CTA (ego-driven)
  if (text.trim().endsWith('?')) score += 30;

  // Binary choice CTA (Template 12)
  if (/team \w+ or team/gi.test(lastSentence)) score += 20;

  // CRITICAL PENALTY: Explicit engagement bait (spam filter trigger)
  const engagementBait = [
    /\b(like this post|save this post|bookmark this)\b/gi,
    /\b(share if you agree|comment below if)\b/gi,
    /\b(drop a like|smash that like)\b/gi,
    /\b(follow for more|follow me for)\b/gi,
  ];
  if (engagementBait.some(p => p.test(text))) score -= 50;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate visual appeal
 * Paper: "Line breaks = visual interest, each worth ~5 points"
 * "Dwell Time = 6x weight"
 */
export const calculateVisualAppeal = (text) => {
  let score = 30;

  // Line breaks (CRITICAL for dwell time - prevents wall of text)
  const lineBreaks = (text.match(/\n/g) || []).length;
  score += Math.min(lineBreaks * 5, 30); // Each break = 5 points, up to 30

  // Double line breaks (paragraph separation - white space)
  const paragraphBreaks = (text.match(/\n\n+/g) || []).length;
  score += Math.min(paragraphBreaks * 8, 24);

  // Emojis: 1-5 optimal (visual interest without spam)
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount >= 1 && emojiCount <= 5) score += 20;
  else if (emojiCount > 8) score -= 15;

  // Paragraph structure (2-4 paragraphs optimal)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 2 && paragraphs.length <= 4) score += 15;
  else if (paragraphs.length === 1 && text.length > 200) score -= 10;
  else if (paragraphs.length > 6) score -= 10; // Too fragmented

  // MAJOR PENALTY: Wall of text (Paper explicitly flags this)
  if (text.length > 400 && lineBreaks === 0) score -= 30;
  if (text.length > 600 && lineBreaks < 3) score -= 20;

  // List formatting (bullets/numbers - scannable)
  const hasList = /^[-•*]\s/gm.test(text) || /^\d+\.\s/gm.test(text);
  if (hasList) score += 15;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate authenticity
 * Paper: "Personal pronouns + contractions = conversational tone"
 * Template 7 (Vulnerability/Teachable Moment) scores high
 */
export const calculateAuthenticity = (text) => {
  let score = 40;

  // Personal pronouns (first-person narrative)
  const personalPronouns = (text.match(/\b(I|I'm|I've|me|my|we|us|our|we're)\b/gi) || []).length;
  score += Math.min(personalPronouns * 3, 30);

  // Contractions (conversational, not corporate)
  const contractions = (text.match(/\b(I'm|you're|we're|they're|it's|that's|don't|can't|won't|isn't|aren't|haven't|hasn't|didn't|doesn't|here's|what's)\b/gi) || []).length;
  score += Math.min(contractions * 2, 20);

  // MAJOR PENALTY: Promotional/sales language (damages authenticity)
  const promotionalPatterns = [
    /\b(buy now|limited time|act now|click here|link in bio)\b/gi,
    /\b(special offer|discount|sale|% off)\b/gi,
    /\b(check out my|visit my|dm for|dm me)\b/gi,
  ];
  const promoCount = promotionalPatterns.filter(p => p.test(text)).length;
  score -= promoCount * 15;

  // Storytelling elements (Templates 6, 7, 8 - narrative structure)
  const storyWords = (text.match(/\b(yesterday|today|last (week|month|year)|once|when i|then i|after|before|story|happened|learned|realized)\b/gi) || []).length;
  score += Math.min(storyWords * 2, 20);

  // Template 7: Vulnerability signals (teachable moment - high authenticity)
  const vulnerabilityPatterns = [
    /i (failed|messed up|struggled|made a mistake)/gi,
    /here('s| is) what i learned/gi,
    /i was wrong about/gi,
  ];
  const vulnCount = vulnerabilityPatterns.filter(p => p.test(text)).length;
  score += Math.min(vulnCount * 15, 30);

  // Specific numbers/data (Template 3 - case studies are authentic)
  if (/i (grew|built|made|went from).*\d+/gi.test(text)) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate conversation depth potential
 * Paper: "Back-and-forth dialogue weighted higher than flat comments"
 * This is critical for the 10x reply signal
 */
export const calculateConversationDepth = (text) => {
  let score = 30;

  // Open-ended questions (how, why, what - drive detailed replies)
  const openQuestions = (text.match(/\b(how|why|what|when|where|which)\b.*\?/gi) || []).length;
  score += Math.min(openQuestions * 20, 50); // High weight - these drive dialogue

  // Personal/ego-driven questions (Template 11)
  const personalPatterns = [
    /your (favorite|biggest|best|worst|proudest)/gi,
    /do you (prefer|think|use|have|agree)/gi,
    /what('s| is) your (take|opinion|experience)/gi,
    /how do you (handle|deal|approach)/gi,
  ];
  const personalCount = personalPatterns.filter(p => p.test(text)).length;
  score += Math.min(personalCount * 15, 35);

  // Multiple questions (encourages multiple angles of discussion)
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount >= 2) score += 20;
  if (questionCount >= 3) score += 10;

  // Controversial/debate prompts (Template 9, 13 - drives back-and-forth)
  const debatePatterns = [
    /unpopular opinion/gi,
    /hot take/gi,
    /am i wrong/gi,
    /change my mind/gi,
    /everyone says.*but/gi,
  ];
  if (debatePatterns.some(p => p.test(text))) score += 20;

  // Advice-seeking (Template 14 - community help drives dialogue)
  if (/i'm struggling with.*how do you/gi.test(text)) score += 20;
  if (/need (advice|help|input)/gi.test(text)) score += 15;

  // PENALTY: Yes/no questions (flat responses, not dialogue)
  if (/\b(is|are|do|does|did|will|would|can|could)\b.*\?/gi.test(text) && questionCount === 1) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate velocity potential (first-hour engagement)
 * Paper: "Speed of interaction within first 15-60 minutes is crucial"
 * "5-10% of initial test group must engage" - velocity threshold
 */
export const calculateVelocityPotential = (text) => {
  let score = 40;

  // Binary choice (Template 12 - low friction, instant replies)
  const binaryPatterns = [
    /team \w+ or team/gi,
    /\bor\b.*\?/gi,
    /(agree or disagree|yes or no)/gi,
  ];
  if (binaryPatterns.some(p => p.test(text))) score += 25;

  // Quick read (fast consumption = fast engagement)
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount <= 30) score += 20; // Very quick read
  else if (wordCount <= 75) score += 15;
  else if (wordCount <= 150) score += 8;
  else if (wordCount > 300) score -= 10; // Slow consumption

  // Emotional triggers (immediate reaction, no thinking required)
  const emotionalTriggers = [
    /shocked|surprised|can't believe/gi,
    /unpopular opinion|hot take/gi,
    /just (realized|found|learned|discovered)/gi,
    /nobody (talks about|tells you)/gi,
  ];
  if (emotionalTriggers.some(p => p.test(text))) score += 20;

  // Direct question (low friction to reply)
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount >= 1) score += 15;

  // Fill-in-blank / one-word answer prompts (Template 13)
  if (/_____|fill in the blank/gi.test(text)) score += 15;

  // Visual content indicator (images stop scroll faster)
  if (/\[image\]|\[chart\]|\[graph\]|swipe/gi.test(text)) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Detect suppression triggers
 * Paper Section 2.3: Safety Layer - "Aggressive integrity systems"
 */
export const detectSuppressionRisks = (text) => {
  const risks = [];
  let riskScore = 0;

  // 1. Engagement bait (Paper: "Explicitly penalized by text classifiers")
  const engagementBait = [
    /\b(like this|save this|bookmark this)\b/gi,
    /\b(share if|comment if|reply if)\b/gi,
    /\b(drop a like|smash that|hit that)\b/gi,
    /\b(follow (me |for more)|turn on notifications)\b/gi,
  ];
  const baitMatches = engagementBait.filter(p => p.test(text));
  if (baitMatches.length > 0) {
    risks.push(`CRITICAL: Engagement bait detected - triggers spam classifiers`);
    riskScore += 35 * baitMatches.length;
  }

  // 2. Excessive hashtags (Paper: ">5 = spam")
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  if (hashtagCount > 5) {
    risks.push(`Too many hashtags (${hashtagCount}) - use 1-2 max for semantic clarity`);
    riskScore += 25;
  }

  // 3. Hashtag stuffing (block of tags)
  if (/(#\w+\s*){3,}/.test(text)) {
    risks.push(`Hashtag stuffing detected - visually spammy`);
    riskScore += 15;
  }

  // 4. External links in body (Paper: "Deprioritized - keep users in-app")
  if (/https?:\/\//i.test(text)) {
    risks.push(`External link in post body - put in comments or bio instead`);
    riskScore += 20;
  }

  // 5. Promotional language (Paper: "Damages authenticity")
  const promoPatterns = [
    /\b(buy now|limited time|act now|click here)\b/gi,
    /\b(sale|discount|\d+% off)\b/gi,
    /\b(link in bio|dm for (more|details|info))\b/gi,
  ];
  const promoCount = promoPatterns.filter(p => p.test(text)).length;
  if (promoCount > 0) {
    risks.push(`Promotional language detected - reduces reach and authenticity`);
    riskScore += 20 * promoCount;
  }

  // 6. Wall of text (Paper: explicit "DO/DON'T" - must have breaks)
  const hasLineBreaks = text.includes('\n');
  if (text.length > 400 && !hasLineBreaks) {
    risks.push(`Wall of text - add line breaks for readability (each = +5 points)`);
    riskScore += 25;
  }
  if (text.length > 600 && (text.match(/\n/g) || []).length < 3) {
    risks.push(`Long post needs more visual breaks (white space)`);
    riskScore += 15;
  }

  // 7. Generic/recycled content (Paper: "Low-quality flag")
  const genericPatterns = [
    /\b(good morning|happy (monday|tuesday|wednesday|thursday|friday))\b/gi,
    /\b(have a (great|good|nice|blessed) (day|week|weekend))\b/gi,
    /\b(rise and grind|hustle hard)\b/gi,
  ];
  if (genericPatterns.some(p => p.test(text))) {
    risks.push(`Generic greeting/phrase - may be flagged as low-quality recycled content`);
    riskScore += 12;
  }

  // 8. All caps (visual spam)
  const capsWords = text.match(/\b[A-Z]{4,}\b/g) || [];
  if (capsWords.length > 2) {
    risks.push(`Excessive caps detected - appears spammy`);
    riskScore += 10;
  }

  // 9. Excessive emoji use (visual spam)
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 8) {
    risks.push(`Too many emojis (${emojiCount}) - optimal is 1-5`);
    riskScore += 15;
  }

  // 10. Spam keywords
  if (/\b(click here|click now|limited slots|hurry|act fast)\b/gi.test(text)) {
    risks.push(`Spam keywords detected - triggers filters`);
    riskScore += 20;
  }

  return {
    risks,
    riskScore: Math.min(100, riskScore),
    safe: riskScore < 20,
    severity: riskScore < 20 ? 'LOW' : riskScore < 50 ? 'MEDIUM' : 'HIGH'
  };
};

/**
 * Calculate relationship signal strength
 * Paper: "System prioritizes content from accounts user has interacted with"
 * This is the "Connected Reach" factor
 */
export const calculateRelationshipPotential = (text) => {
  let score = 40;

  // Direct mentions (Paper: "Relationship signal - variable weight")
  const mentionCount = (text.match(/@\w+/g) || []).length;
  score += Math.min(mentionCount * 12, 40);

  // Reply context (Paper: "Notification density" - reply ladder strategy)
  if (/^@\w+/i.test(text.trim())) {
    score += 20; // This is a reply, gets notification reach
  }

  // Tag-a-friend mechanic (Template 15 - notification velocity)
  if (/tag (a|someone)/gi.test(text)) score += 15;

  return Math.max(0, Math.min(100, score));
};

/**
 * Detect "rage bait" patterns
 * Paper: "High volume of replies BUT also high Hide/Block = suppression"
 * Critical safety metric
 */
export const detectRageBait = (text) => {
  let rageBaitScore = 0;
  const indicators = [];

  // 1. Extreme inflammatory language
  const extremePatterns = [
    /\b(hate|destroy|kill|attack|war on)\b/gi,
    /\b(idiots|stupid people|morons|losers)\b/gi,
    /\b(disgusting|pathetic|worthless)\b/gi,
  ];
  extremePatterns.forEach(pattern => {
    if (pattern.test(text)) {
      rageBaitScore += 25;
      indicators.push('Inflammatory language');
    }
  });

  // 2. Political trigger words (Paper: "High hide/block risk")
  const politicalTriggers = text.match(/\b(trump|biden|democrat|republican|liberal|conservative|woke|maga)\b/gi) || [];
  if (politicalTriggers.length > 2) {
    rageBaitScore += 20;
    indicators.push('Heavy political content');
  }

  // 3. Inflammatory generalizations
  const generalizationPatterns = [
    /\b(all|every|always|never)\b.*(people|men|women|boomers|millennials|gen z)\b/gi,
  ];
  if (generalizationPatterns.some(p => p.test(text))) {
    rageBaitScore += 15;
    indicators.push('Inflammatory generalization');
  }

  // 4. Outrage farming
  if (/you won't believe|this is (insane|crazy|ridiculous)|i'm (furious|outraged)/gi.test(text)) {
    rageBaitScore += 12;
    indicators.push('Outrage farming language');
  }

  // 5. Us vs. them framing (divisive)
  if (/people (who|that) (don't|do).*are/gi.test(text)) {
    rageBaitScore += 10;
    indicators.push('Divisive us-vs-them framing');
  }

  return {
    isRageBait: rageBaitScore > 30,
    rageBaitScore: Math.min(100, rageBaitScore),
    indicators: [...new Set(indicators)],
    severity: rageBaitScore < 20 ? 'LOW' : rageBaitScore < 40 ? 'MEDIUM' : 'HIGH'
  };
};

/**
 * Calculate profile tap potential
 * Paper: "Profile taps = 5x weight (Discovery-to-follow pipeline)"
 * Critical for growth, not just engagement
 */
export const calculateProfileTapPotential = (text) => {
  let score = 35;

  // Authority/credibility signals (Template 3, 10)
  const authorityPatterns = [
    /i (built|created|grew|made|scaled).*(\d+|to)/gi,
    /my (company|startup|business|team)/gi,
    /\d+ (years|months) (of )?(experience|in the industry)/gi,
    /i (tested|analyzed|researched|studied).*\d+/gi,
  ];
  const authorityCount = authorityPatterns.filter(p => p.test(text)).length;
  score += Math.min(authorityCount * 18, 40);

  // Results/proof (makes people want to know more)
  const resultsPatterns = [
    /\$[\d,]+/gi, // Money figures
    /[\d,]+%/gi, // Percentages
    /\d+x/gi, // Multipliers
    /from \$?\d+.*to \$?\d+/gi, // Before/after
  ];
  const resultsCount = resultsPatterns.filter(p => p.test(text)).length;
  score += Math.min(resultsCount * 15, 35);

  // Unique perspective (Template 5, 9)
  const uniquePatterns = [
    /unpopular opinion/gi,
    /hot take/gi,
    /here's what (nobody|no one) tells you/gi,
    /i finally figured out/gi,
    /the (truth|secret) about/gi,
  ];
  if (uniquePatterns.some(p => p.test(text))) score += 20;

  // Expertise demonstration
  if (/i (teach|coach|help|advise|consult)/gi.test(text)) score += 15;

  // Specific niche positioning
  if (/as a (founder|ceo|developer|designer|marketer)/gi.test(text)) score += 12;

  return Math.max(0, Math.min(100, score));
};

/**
 * Analyze "See More" expansion potential
 * Paper: "Long posts with 'See More' trigger micro-conversion"
 * Dwell time signal
 */
export const calculateSeeMorePotential = (text) => {
  const length = text.length;
  let score = 0;

  // Paper: "See More typically triggers around 280 chars"
  if (length > 280 && length <= 500) {
    score = 80; // Sweet spot for expansion + full read
  } else if (length > 500 && length <= 800) {
    score = 70; // Good, strong hook needed
  } else if (length > 800 && length <= 1500) {
    score = 55; // Very long, needs compelling hook
  } else if (length > 1500) {
    score = 35; // Thread territory, different strategy
  } else if (length >= 200 && length <= 280) {
    score = 45; // On the cusp, might trigger
  } else {
    score = 15; // Too short for "See More"
  }

  // Hook quality matters MORE for long posts (must justify click)
  const firstSentence = text.split(/[.!?\n]/)[0];
  if (length > 280) {
    if (firstSentence.length > 120) {
      score -= 20; // Slow hook on long post = death
    }
    // Strong hooks boost long-form
    if (/^(stop|here's|i finally|unpopular)/i.test(firstSentence)) {
      score += 15;
    }
  }

  // Line breaks help long posts feel digestible
  if (length > 280) {
    const lineBreaks = (text.match(/\n/g) || []).length;
    if (lineBreaks >= 3) score += 10;
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate "saves" potential
 * Paper: "High-value content gets saved for reference"
 * Template 10: Resource Drop
 */
export const calculateSavesPotential = (text) => {
  let score = 25;

  // Template 10: Resource compilations
  const resourcePatterns = [
    /\d+\s+(tools|resources|apps|sites|websites|platforms)/gi,
    /best \d+ (tools|resources|ways|tips)/gi,
    /top \d+/gi,
  ];
  if (resourcePatterns.some(p => p.test(text))) score += 30;

  // Template 4: List format (scannable, reference value)
  const listPatterns = [
    /\d+\s+(ways|tips|steps|reasons|tricks|hacks)/gi,
    /^[-•*]\s/gm,
    /^\d+\.\s/gm,
  ];
  if (listPatterns.some(p => p.test(text))) score += 25;

  // Template 8: Educational/tutorial (Step-by-step)
  const tutorialPatterns = [
    /\b(how to|step by step|guide|tutorial)\b/gi,
    /step \d+:/gi,
  ];
  if (tutorialPatterns.some(p => p.test(text))) score += 25;

  // Reference value keywords
  const referenceWords = [
    /\b(framework|template|checklist|cheatsheet|playbook)\b/gi,
    /\b(formula|system|method|strategy)\b/gi,
  ];
  if (referenceWords.some(p => p.test(text))) score += 20;

  // Time investment signal (compiled over time)
  if (/i spent (hours|days|weeks|months).*collecting|testing|analyzing/gi.test(text)) score += 15;

  // Long-form educational (threads get saved)
  if (text.length > 500 && listPatterns.some(p => p.test(text))) score += 10;

  return Math.max(0, Math.min(100, score));
};

/**
 * Detect template usage from research (Templates 1-20)
 * Paper Section 6: Template Library
 */
export const detectTemplate = (text) => {
  const templates = [];

  // Template 1: Negative Outcome Hook
  if (/stop (doing|using).*(killing|hurting|ruining|destroying)/gi.test(text)) {
    templates.push({ 
      number: 1, 
      name: 'Negative Outcome Hook',
      signals: ['Hook Strength', 'Dwell Time']
    });
  }

  // Template 2: Hard Truth Hook
  if (/(is a lie|is wrong|is overrated|is dead).*here('s| is)/gi.test(text)) {
    templates.push({ 
      number: 2, 
      name: 'Hard Truth Hook',
      signals: ['Curiosity', 'Replies (debate)']
    });
  }

  // Template 3: Time Frame Case Study
  if (/how i (went|grew|built|made).*(from|to).*in \d+ (days|weeks|months)/gi.test(text)) {
    templates.push({ 
      number: 3, 
      name: 'Time Frame Case Study',
      signals: ['Saves', 'Profile Taps', 'Authenticity']
    });
  }

  // Template 4: Specific Number List
  if (/\d+ (ways|tips|tools|steps).*number \d+/gi.test(text)) {
    templates.push({ 
      number: 4, 
      name: 'Specific Number List',
      signals: ['Dwell Time', 'Saves']
    });
  }

  // Template 5: Curiosity Gap
  if (/i finally (figured out|learned|discovered) (why|how)/gi.test(text)) {
    templates.push({ 
      number: 5, 
      name: 'Curiosity Gap',
      signals: ['Profile Taps', 'Thread Expansion']
    });
  }

  // Template 6: Before & After Narrative
  if (/old me:.*new me:/gi.test(text) || /before:.*after:/gi.test(text)) {
    templates.push({ 
      number: 6, 
      name: 'Before & After Narrative',
      signals: ['Likes (relatability)', 'Saves']
    });
  }

  // Template 7: Teachable Moment (Vulnerability)
  if (/i (messed up|failed|made a mistake).*here('s| is) what i learned/gi.test(text)) {
    templates.push({ 
      number: 7, 
      name: 'Teachable Moment',
      signals: ['Saves', 'Reposts', 'Authenticity']
    });
  }

  // Template 8: Step-by-Step Tutorial
  if (/step \d+:.*step \d+:/gi.test(text)) {
    templates.push({ 
      number: 8, 
      name: 'Step-by-Step Tutorial',
      signals: ['Saves (reference)', 'Dwell Time']
    });
  }

  // Template 9: Contrarian Explanation
  if (/everyone says.*but (actually|here's)/gi.test(text)) {
    templates.push({ 
      number: 9, 
      name: 'Contrarian Explanation',
      signals: ['Replies (debate)', 'Profile Taps']
    });
  }

  // Template 10: Resource Drop
  if (/i spent.*(collecting|testing).*here are the (top|best) \d+/gi.test(text)) {
    templates.push({ 
      number: 10, 
      name: 'Resource Drop',
      signals: ['Saves', 'Reposts', 'Profile Taps']
    });
  }

  // Template 11: Ego Bait Question
  if (/what('s| is) your (biggest|favorite|best|proudest)/gi.test(text)) {
    templates.push({ 
      number: 11, 
      name: 'Ego Bait Question',
      signals: ['Replies (10x weight)']
    });
  }

  // Template 12: Binary Choice
  if (/team \w+ or team.*\?/gi.test(text)) {
    templates.push({ 
      number: 12, 
      name: 'Binary Choice',
      signals: ['Replies', 'Velocity']
    });
  }

  // Template 13: Fill in the Blank
  if (/unpopular opinion:.*is (overrated|underrated)/gi.test(text) || /_____/g.test(text)) {
    templates.push({ 
      number: 13, 
      name: 'Fill in the Blank',
      signals: ['Replies', 'Velocity']
    });
  }

  // Template 14: Advice Seek
  if (/i'm struggling with.*how do you/gi.test(text)) {
    templates.push({ 
      number: 14, 
      name: 'Advice Seek',
      signals: ['Replies (community help)']
    });
  }

  // Template 15: Tag a Friend
  if (/tag (a|someone) (who|friend)/gi.test(text)) {
    templates.push({ 
      number: 15, 
      name: 'Tag a Friend',
      signals: ['Notification Velocity', 'Reposts']
    });
  }

  // Template 16: Chart/Data Visual
  if (/this (chart|graph|data) (shows|explains)/gi.test(text)) {
    templates.push({ 
      number: 16, 
      name: 'Chart Caption',
      signals: ['Dwell Time', 'Stops Scroll']
    });
  }

  // Template 17: Screenshot Commentary
  if (/screenshot|my take:/gi.test(text)) {
    templates.push({ 
      number: 17, 
      name: 'Screenshot Commentary',
      signals: ['Reposts (curation)']
    });
  }

  // Template 18: Quote Card
  if (/read that again/gi.test(text)) {
    templates.push({ 
      number: 18, 
      name: 'Quote Card',
      signals: ['Reposts (identity)']
    });
  }

  // Template 19: Carousel Intro
  if (/swipe to (learn|see)/gi.test(text) || /slide \d+/gi.test(text)) {
    templates.push({ 
      number: 19, 
      name: 'Carousel',
      signals: ['Dwell Time', 'Saves', 'Swipes']
    });
  }

  // Template 20: Video Tease
  if (/watch this.*clip/gi.test(text)) {
    templates.push({ 
      number: 20, 
      name: 'Video Tease',
      signals: ['Watch Time', 'Stops Scroll']
    });
  }

  return templates;
};

/**
 * Calculate viral potential with RESEARCH-BASED weights
 * Paper Section 2.2: Confirmed signal weights from Meta engineering
 */
export const calculateViralPotential = (scores) => {
  // CONFIRMED WEIGHTS from Paper:
  // Replies = 10x (CRITICAL)
  // Reposts = 8x (HIGH) 
  // Dwell Time = 6x (HIGH)
  // Profile Taps = 5x (MED-HIGH)
  // Likes = 3x (MEDIUM)
  
  const weights = {
    engagement: 0.35,           // Replies = 10x (most critical)
    conversationDepth: 0.20,    // Back-and-forth = higher weight
    hook: 0.15,                 // Stops scroll (initial filter)
    readability: 0.10,          // Dwell time = 6x
    velocityPotential: 0.08,    // First hour critical
    profileTapPotential: 0.05,  // Profile taps = 5x
    visual: 0.04,               // Supporting (dwell time factor)
    authenticity: 0.03,         // Supporting (anti-spam)
  };

  const weightedScore = 
    scores.engagement * weights.engagement +
    scores.conversationDepth * weights.conversationDepth +
    scores.hook * weights.hook +
    scores.readability * weights.readability +
    scores.velocityPotential * weights.velocityPotential +
    scores.profileTapPotential * weights.profileTapPotential +
    scores.visual * weights.visual +
    scores.authenticity * weights.authenticity;

  // Apply suppression penalty (can kill viral potential)
  const suppressionPenalty = scores.suppressionRisk.riskScore * 0.4;

  // Apply rage bait penalty (Hide/Block actions)
  const rageBaitPenalty = scores.rageBait.rageBaitScore * 0.3;

  // Final score
  let finalScore = weightedScore - suppressionPenalty - rageBaitPenalty;

  // Bonus for template usage (research-validated structures)
  if (scores.detectedTemplates.length > 0) {
    finalScore += 5; // Small bonus for using proven frameworks
  }

  return Math.max(0, Math.min(100, Math.round(finalScore)));
};

/**
 * Analyze post - complete analysis with all metrics
 */
export const analyzePost = (text) => {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const scores = {
    // Core engagement metrics (aligned with 10x, 8x, 6x, 5x, 3x weights)
    engagement: calculateEngagementPotential(text),
    conversationDepth: calculateConversationDepth(text),
    hook: calculateHookStrength(text),
    readability: calculateReadability(text),
    velocityPotential: calculateVelocityPotential(text),
    profileTapPotential: calculateProfileTapPotential(text),
    
    // Supporting metrics
    visual: calculateVisualAppeal(text),
    authenticity: calculateAuthenticity(text),
    sentiment: calculateSentiment(text),
    cta: calculateCTAQuality(text),
    
    // Platform-specific metrics
    seeMorePotential: calculateSeeMorePotential(text),
    savesPotential: calculateSavesPotential(text),
    relationshipPotential: calculateRelationshipPotential(text),
    
    // Safety/risk metrics (CRITICAL)
    suppressionRisk: detectSuppressionRisks(text),
    rageBait: detectRageBait(text),
    
    // Template detection
    detectedTemplates: detectTemplate(text),
  };

  // Calculate viral potential last (uses all other scores)
  scores.viral = calculateViralPotential(scores);

  // Add metadata
  scores.metadata = {
    wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
    charCount: text.length,
    lineBreaks: (text.match(/\n/g) || []).length,
    questions: (text.match(/\?/g) || []).length,
    hashtags: (text.match(/#\w+/g) || []).length,
    mentions: (text.match(/@\w+/g) || []).length,
    emojis: (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length,
  };

  return scores;
};

/**
 * Generate recommendations based on analysis
 * Prioritized by Paper's confirmed signal weights
 */
export const generateRecommendations = (scores, text) => {
  const recommendations = [];

  // CRITICAL: Suppression risks (can completely kill reach)
  if (!scores.suppressionRisk.safe) {
    scores.suppressionRisk.risks.forEach(risk => {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Safety Layer',
        action: risk,
        impact: 'Can trigger spam filters and kill all reach'
      });
    });
  }

  // CRITICAL: Rage bait detection
  if (scores.rageBait.isRageBait) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Safety Layer',
      action: `Rage bait detected (${scores.rageBait.severity} risk) - high Hide/Block rate will suppress post`,
      impact: 'Algorithm penalizes content with high engagement + high hide rate'
    });
  }

  // HIGH: Reply optimization (10x weight - MOST important signal)
  if (scores.engagement < 65) {
    if (!(text.includes('?'))) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Replies (10x weight)',
        action: 'Add a question to trigger replies - this is the #1 ranking signal',
        impact: '+20-40 points'
      });
    }
    
    if (scores.conversationDepth < 55) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Replies (10x weight)',
        action: 'Use ego-bait: "What\'s your biggest [X]?" or "Team A or Team B?" (Templates 11-12)',
        impact: '+25-35 points'
      });
    }

    const hasOpenQuestion = /\b(how|why|what)\b.*\?/gi.test(text);
    if (!hasOpenQuestion) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Conversation Depth',
        action: 'Add open-ended question (how/why/what) to drive back-and-forth dialogue',
        impact: '+20-30 points'
      });
    }
  }

  // HIGH: Hook optimization (stops scroll)
  if (scores.hook < 65) {
    const firstSentence = text.split(/[.!?\n]/)[0];
    if (firstSentence.length > 100) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Hook',
        action: 'Shorten first sentence to under 50 chars for instant impact',
        impact: '+15-20 points'
      });
    }

    recommendations.push({
      priority: 'HIGH',
      category: 'Hook',
      action: 'Use proven hook template: "Stop doing X" (Template 1), "I finally figured out" (Template 5), or numbers',
      impact: '+20-30 points'
    });
  }

  // MEDIUM: Dwell time optimization (6x weight)
  if (scores.visual < 60 || scores.readability < 60) {
    const lineBreaks = (text.match(/\n/g) || []).length;
    if (lineBreaks < 2 && text.length > 200) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Dwell Time (6x weight)',
        action: 'Add line breaks - each break = +5 points, up to +30 total',
        impact: '+10-30 points'
      });
    }

    if (text.length > 280 && text.length < 500) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Dwell Time',
        action: 'Perfect length for "See More" expansion - micro-conversion signal',
        impact: 'Positive'
      });
    }
  }

  // MEDIUM: Velocity optimization (first-hour critical)
  if (scores.velocityPotential < 60) {
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 150) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Velocity (Golden Window)',
        action: 'Shorten for quick read - must hit 5-10% engagement in first hour',
        impact: '+15-20 points'
      });
    }

    if (!/(team|or).*\?/gi.test(text)) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Velocity',
        action: 'Add binary choice (Template 12) for instant, low-friction replies',
        impact: '+20-25 points'
      });
    }
  }

  // MEDIUM: Profile tap potential (5x weight - growth driver)
  if (scores.profileTapPotential < 55) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Profile Taps (5x weight)',
      action: 'Add authority signal: results (numbers), expertise, or unique perspective',
      impact: '+15-30 points'
    });
  }

  // LOW: Saves optimization (long-term value)
  if (scores.savesPotential < 50 && text.length > 200) {
    recommendations.push({
      priority: 'LOW',
      category: 'Saves',
      action: 'Add list format or tutorial structure (Templates 4, 8, 10) for reference value',
      impact: '+20-30 points'
    });
  }

  // LOW: Length optimization
  const length = text.length;
  if (length < 100) {
    recommendations.push({
      priority: 'LOW',
      category: 'Length',
      action: 'Consider expanding to 150-300 chars (optimal engagement zone)',
      impact: '+10-15 points'
    });
  } else if (length > 800 && scores.hook < 70) {
    recommendations.push({
      priority: 'LOW',
      category: 'Length',
      action: 'Very long post - needs exceptional hook to justify read time',
      impact: 'Critical'
    });
  }

  // LOW: CTA optimization
  if (scores.cta < 45 && scores.engagement < 60) {
    recommendations.push({
      priority: 'LOW',
      category: 'CTA',
      action: 'Add question at end: "What do you think?" or "How do you handle this?"',
      impact: '+15-25 points'
    });
  }

  // Template suggestions (if no templates detected and low viral score)
  if (scores.detectedTemplates.length === 0 && scores.viral < 65) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Template Framework',
      action: 'Consider using research-backed template: #11 (Ego Bait), #12 (Binary Choice), #4 (Number List), or #7 (Teachable Moment)',
      impact: '+10-20 points + proven structure'
    });
  }

  // Positive reinforcement
  if (scores.viral >= 75) {
    recommendations.push({
      priority: 'INFO',
      category: 'Quality',
      action: '✅ Strong viral potential - post aligns with algorithm priorities',
      impact: 'Positive'
    });
  }

  if (scores.detectedTemplates.length > 0) {
    const templateNames = scores.detectedTemplates.map(t => `#${t.number}`).join(', ');
    recommendations.push({
      priority: 'INFO',
      category: 'Template',
      action: `✅ Using proven template(s): ${templateNames}`,
      impact: 'Positive'
    });
  }

  return recommendations;
};

/**
 * Generate detailed report
 * For comprehensive analysis with paper-backed explanations
 */
export const generateReport = (scores, text) => {
  const report = {
    overallScore: scores.viral,
    grade: scores.viral >= 80 ? 'A' : scores.viral >= 70 ? 'B' : scores.viral >= 60 ? 'C' : scores.viral >= 50 ? 'D' : 'F',
    
    criticalSignals: {
      replies: {
        score: scores.engagement,
        weight: '10x',
        status: scores.engagement >= 70 ? 'GOOD' : scores.engagement >= 50 ? 'FAIR' : 'NEEDS WORK',
        note: 'Most critical ranking signal - conversation drives reach'
      },
      reposts: {
        score: Math.round((scores.engagement * 0.4 + scores.profileTapPotential * 0.6)),
        weight: '8x',
        status: scores.engagement >= 60 ? 'GOOD' : 'NEEDS WORK',
        note: 'Shareability and identity signaling'
      },
      dwellTime: {
        score: Math.round((scores.readability * 0.5 + scores.visual * 0.5)),
        weight: '6x',
        status: scores.visual >= 60 && scores.readability >= 60 ? 'GOOD' : 'NEEDS WORK',
        note: 'Line breaks, readability, "See More" expansion'
      },
      profileTaps: {
        score: scores.profileTapPotential,
        weight: '5x',
        status: scores.profileTapPotential >= 60 ? 'GOOD' : 'NEEDS WORK',
        note: 'Discovery-to-follow pipeline - growth driver'
      }
    },
    
    safetyCheck: {
      suppressionRisk: scores.suppressionRisk.severity,
      rageBaitRisk: scores.rageBait.severity,
      safe: scores.suppressionRisk.safe && !scores.rageBait.isRageBait,
      warnings: [
        ...scores.suppressionRisk.risks,
        ...scores.rageBait.indicators.map(i => `Rage bait: ${i}`)
      ]
    },
    
    templates: scores.detectedTemplates,
    
    recommendations: generateRecommendations(scores, text),
    
    metadata: scores.metadata
  };

  return report;
};