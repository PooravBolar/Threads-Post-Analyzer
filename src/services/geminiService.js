import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file');
}

// Allow overriding the model from .env
// Recommended: gemini-1.5-pro for best results with complex analysis
const MODEL_ID = import.meta.env.VITE_GEMINI_MODEL_ID || 'gemini-pro';

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Get the Gemini model instance
 */
export const getModel = () => {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }
  return genAI.getGenerativeModel({ model: MODEL_ID });
};

/**
 * Research-based system prompt for Threads algorithm understanding
 */
const THREADS_ALGORITHM_KNOWLEDGE = `
# Threads Algorithm Knowledge Base (2026)

You are an expert on Meta's Threads algorithm based on confirmed engineering documentation.

## CONFIRMED SIGNAL WEIGHTS (Meta Engineering):
1. **Replies = 10x** (MOST CRITICAL) - Conversation drives reach
2. **Reposts = 8x** (HIGH) - Shareability and identity signaling
3. **Dwell Time = 6x** (HIGH) - Time spent reading (line breaks critical)
4. **Profile Taps = 5x** (MED-HIGH) - Discovery-to-follow pipeline
5. **Likes = 3x** (MEDIUM) - Baseline signal, insufficient alone

## CRITICAL SUCCESS FACTORS:

### First Hour "Golden Window"
- 5-10% of initial test group MUST engage in first 15-60 minutes
- Velocity determines "For You" feed injection
- Back-and-forth dialogue > flat comments

### Conversation Depth (10x Weight)
- Open-ended questions (how/why/what) > yes/no questions
- Ego-driven questions ("What's YOUR biggest...") drive replies
- Multiple angles of discussion = higher weight

### Suppression Triggers (AVOID):
1. Engagement bait: "Like this", "Share if", "Comment below" = SPAM FILTER
2. >5 hashtags = spam (use 1-2 semantic tags max)
3. External links in body (put in comments)
4. Promotional language (buy now, limited time, etc.)
5. Wall of text (no line breaks on 400+ char posts)
6. Generic greetings ("Good morning", "Happy Monday")
7. Hashtags (don't use even one)
8. Emojis (don't use any)
9. Rage bait (high replies + high hide/block = suppression)

### 20 Research-Validated Templates:

**HOOKS (Stop Scroll):**
1. Negative Outcome: "Stop doing X. It's killing Y"
2. Hard Truth: "X is a lie. Here's the data"
3. Time Frame Case Study: "How I went from A to B in 30 days"
4. Specific Number List: "7 ways to X. Number 4 is key"
5. Curiosity Gap: "I finally figured out why X"

**BODY (Retention):**
6. Before & After: "Old Me: X. New Me: Y"
7. Teachable Moment: "I messed up. Here's what I learned"
8. Step-by-Step: "Step 1:... Step 2:..."
9. Contrarian: "Everyone says X. But actually Y"
10. Resource Drop: "I spent hours testing. Top 5:"

**CTAs (Engagement):**
11. Ego Bait: "What's your biggest win this week?"
12. Binary Choice: "Team A or Team B?"
13. Fill in Blank: "Unpopular opinion: ___ is overrated"
14. Advice Seek: "I'm struggling with X. How do you?"
15. Tag a Friend: "Tag someone who needs this"

**VISUAL/HYBRID:**
16. Chart Caption: Data visualization
17. Screenshot Commentary: Curated content
18. Quote Card: "Read that again"
19. Carousel: "Swipe to learn"
20. Video Tease: "Watch this clip"

## OPTIMAL POST STRUCTURE:

**Length:**
- 150-300 chars = optimal engagement
- 280-500 chars = "See More" expansion (micro-conversion)
- <100 chars = digital bumper sticker (high repost)

**Formatting:**
- Line breaks = +5 points each (up to 6 breaks)
- 2-4 paragraphs optimal
- White space prevents wall of text
- Avoid using emojis (1-2 max)
- Avoid Hashtags

**Hook (First Sentence):**
- <50 chars = instant impact
- Must stop scroll (shock, curiosity, question, numbers)
- Pattern interrupt

**CTA (Last Sentence):**
- Question at end = implicit CTA
- Personal/ego-driven questions best
- NEVER use engagement bait

## CONTENT PHYSICS:

**High Reply Drivers:**
- Open questions about user's experience
- Binary choices (low friction)
- Controversial (safe) takes
- Advice-seeking
- Fill-in-blank prompts

**High Repost Drivers:**
- Short, quotable (under 100 chars)
- Makes sharer look smart/informed
- Contrarian insights
- Data/statistics

**High Save Drivers:**
- Lists (tools, resources, tips)
- Step-by-step tutorials
- Frameworks/templates
- Time investment signal ("I spent X hours")

**Profile Tap Drivers:**
- Authority signals ("I built", "I tested")
- Results/proof (numbers, $, %)
- Unique perspective
- Expertise demonstration
`;

/**
 * Analyze post using Gemini AI with research-based criteria
 */
export const analyzePostWithContext = async (postText, referenceData) => {
  try {
    const model = getModel();
    
    const referenceContext = referenceData && referenceData.length > 0
      ? `\n\nReference Database (High-Performing Posts):\n${JSON.stringify(referenceData.slice(0, 5), null, 2)}`
      : '';

    const prompt = `${THREADS_ALGORITHM_KNOWLEDGE}

${referenceContext}

## ANALYSIS TASK:

Analyze this Threads post using CONFIRMED algorithmic weights:

**Post:**
"${postText}"

Provide detailed JSON analysis with these exact metrics:

{
  "scores": {
    "engagement": 0-100,              // Reply potential (10x weight - CRITICAL)
    "conversationDepth": 0-100,       // Back-and-forth dialogue potential
    "hook": 0-100,                    // First sentence stops scroll
    "readability": 0-100,             // Flesch reading ease
    "velocityPotential": 0-100,       // First-hour engagement likelihood
    "profileTapPotential": 0-100,     // Discovery-to-follow (5x weight)
    "visual": 0-100,                  // Line breaks, formatting
    "authenticity": 0-100,            // Genuine, conversational tone
    "cta": 0-100,                     // Call-to-action quality
    "savesPotential": 0-100,          // Reference value
    "viral": 0-100                    // Overall viral potential
  },
  "detectedTemplates": [
    {
      "number": 1-20,
      "name": "Template Name",
      "signals": ["Signal optimized"]
    }
  ],
  "suppressionRisks": {
    "risks": ["Specific risk if any"],
    "riskScore": 0-100,
    "severity": "LOW/MEDIUM/HIGH",
    "safe": true/false
  },
  "rageBait": {
    "isRageBait": false,
    "rageBaitScore": 0-100,
    "indicators": []
  },
  "metadata": {
    "wordCount": 0,
    "charCount": 0,
    "lineBreaks": 0,
    "questions": 0,
    "hashtags": 0
  },
  "strengths": ["What works well"],
  "weaknesses": ["What needs improvement"],
  "criticalSignals": {
    "replies": { "score": 0-100, "weight": "10x", "status": "GOOD/FAIR/POOR" },
    "reposts": { "score": 0-100, "weight": "8x", "status": "GOOD/FAIR/POOR" },
    "dwellTime": { "score": 0-100, "weight": "6x", "status": "GOOD/FAIR/POOR" },
    "profileTaps": { "score": 0-100, "weight": "5x", "status": "GOOD/FAIR/POOR" }
  }
}

Be precise, cite specific templates, and prioritize based on confirmed 10x/8x/6x/5x weights.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      } catch (parseError) {
        console.warn('JSON parse error:', parseError);
      }
    }
    
    // Fallback structure
    return { 
      scores: {
        engagement: 50,
        viral: 50
      },
      analysis: text,
      error: 'Could not parse structured response'
    };
  } catch (error) {
    console.error('Error analyzing post:', error);
    throw error;
  }
};

/**
 * Enhance post using Gemini AI with research-validated templates
 */
export const enhancePostWithContext = async (postText, referenceData, analysisScores) => {
  try {
    if (!genAI) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const model = getModel();
    
    // Format reference data
    let referenceContext = '';
    if (referenceData && referenceData.length > 0) {
      const formattedRefs = referenceData
        .filter(ref => ref && (typeof ref === 'string' || ref.postText))
        .map((ref, idx) => {
          const text = typeof ref === 'string' ? ref : (ref.postText || JSON.stringify(ref));
          return `Example ${idx + 1} (High-Performing):\n${text}`;
        })
        .slice(0, 8); // Limit to top 8
      
      if (formattedRefs.length > 0) {
        referenceContext = `\n\n## HIGH-PERFORMING REFERENCE POSTS:\n${formattedRefs.join('\n\n')}\n\nStudy these patterns and apply similar structures.`;
      }
    }

    // Analysis context
    const analysisContext = analysisScores
      ? `\n\n## CURRENT POST ANALYSIS:\n${JSON.stringify(analysisScores, null, 2)}\n\n**Priority Improvements Needed:**
- If engagement < 70: Add ego-bait question (10x weight)
- If hook < 70: Use Template 1, 2, or 5
- If visual < 60: Add line breaks (6x dwell time weight)
- If suppressionRisk > 20: Remove engagement bait/spam triggers`
      : '';

    const prompt = `${THREADS_ALGORITHM_KNOWLEDGE}

${referenceContext}

${analysisContext}

## ENHANCEMENT TASK:

Original Post:
"${postText}"

Create 3 enhanced versions following RESEARCH-VALIDATED patterns:

**REQUIREMENTS:**
1. Use proven templates (1-20) when applicable
2. Optimize for 10x reply signal (questions, ego-bait)
3. Add line breaks for 6x dwell time weight
4. Avoid ALL suppression triggers
5. Hook must be <50 chars when possible
6. Include CTA at end (question, not bait)
7. Target 150-300 chars for optimal engagement OR 280-500 for "See More"
8. 1-3 emojis max (NOT 5+)
9. 1-2 hashtags max (semantic, not spam)
10. NO promotional language

**Version 1 - Subtle Enhancement:**
- Keep core message and voice
- Fix suppression risks
- Add line breaks
- Strengthen hook slightly
- Add/improve question

**Version 2 - Moderate Enhancement:**
- Apply 1-2 proven templates
- Optimize length (150-300 or 280-500 chars)
- Strong hook (Template 1, 2, or 5)
- Clear CTA question
- Authority/credibility signals

**Version 3 - Maximum Viral Potential:**
- Full template implementation (best match for topic)
- Optimized for all critical signals (10x, 8x, 6x, 5x)
- Pattern-interrupt hook
- Multiple engagement drivers
- Profile tap signals (results, expertise)

Return JSON format:
{
  "subtle": {
    "text": "Enhanced post text...",
    "template": "Template name or 'Original structure'",
    "changes": ["Change 1", "Change 2"],
    "expectedScore": 0-100
  },
  "moderate": {
    "text": "Enhanced post text...",
    "template": "Template #X: Name",
    "changes": ["Change 1", "Change 2"],
    "expectedScore": 0-100
  },
  "complete": {
    "text": "Enhanced post text...",
    "template": "Template #X: Name",
    "changes": ["Change 1", "Change 2"],
    "expectedScore": 0-100
  },
  "recommendations": [
    {
      "priority": "CRITICAL/HIGH/MEDIUM/LOW",
      "category": "Replies (10x) / Dwell Time (6x) / etc",
      "action": "Specific action",
      "impact": "Expected impact"
    }
  ]
}

Be specific about which templates you're using and why. Prioritize 10x reply signal above all else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate structure
        if (parsed.subtle || parsed.moderate || parsed.complete) {
          return {
            subtle: typeof parsed.subtle === 'object' ? parsed.subtle.text : parsed.subtle,
            moderate: typeof parsed.moderate === 'object' ? parsed.moderate.text : parsed.moderate,
            complete: typeof parsed.complete === 'object' ? parsed.complete.text : parsed.complete,
            explanations: {
              subtle: parsed.subtle?.changes?.join('; ') || 'Subtle enhancement',
              moderate: parsed.moderate?.changes?.join('; ') || 'Moderate enhancement',
              complete: parsed.complete?.changes?.join('; ') || 'Maximum viral optimization'
            },
            templates: {
              subtle: parsed.subtle?.template || 'Original',
              moderate: parsed.moderate?.template || 'Template applied',
              complete: parsed.complete?.template || 'Full template'
            },
            expectedScores: {
              subtle: parsed.subtle?.expectedScore || 65,
              moderate: parsed.moderate?.expectedScore || 75,
              complete: parsed.complete?.expectedScore || 85
            },
            recommendations: parsed.recommendations || []
          };
        }
      } catch (parseError) {
        console.warn('Failed to parse enhancement JSON:', parseError);
      }
    }
    
    // Fallback: extract text versions
    const lines = text.split('\n');
    return {
      subtle: extractVersion(lines, ['subtle', 'version 1', 'minor']) || postText,
      moderate: extractVersion(lines, ['moderate', 'version 2', 'medium']) || postText,
      complete: extractVersion(lines, ['complete', 'version 3', 'maximum', 'viral']) || postText,
      explanations: {
        subtle: 'Subtle enhancements applied',
        moderate: 'Research-based moderate improvements',
        complete: 'Maximum viral potential optimization'
      }
    };
  } catch (error) {
    console.error('Error enhancing post:', error);
    
    // Specific error messages
    if (error.message?.includes('API key')) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    } else if (error.message?.includes('quota') || error.message?.includes('429')) {
      throw new Error('API quota exceeded. Please try again later or upgrade your Gemini API plan.');
    } else if (error.message?.includes('safety')) {
      throw new Error('Content blocked by safety filters. Try rewording to be less controversial.');
    } else if (error.message?.includes('model not found')) {
      throw new Error(`Model "${MODEL_ID}" not found. Try setting VITE_GEMINI_MODEL_ID=gemini-1.5-pro in .env`);
    } else if (error.message) {
      throw new Error(`Enhancement failed: ${error.message}`);
    } else {
      throw new Error('Failed to enhance post. Please check your API key and try again.');
    }
  }
};

/**
 * Helper function to extract version text from AI response
 */
const extractVersion = (lines, keywords) => {
  const startIndex = lines.findIndex(line => 
    keywords.some(kw => line.toLowerCase().includes(kw))
  );
  
  if (startIndex === -1) return null;
  
  // Find the actual text (skip headers/labels)
  for (let i = startIndex; i < Math.min(startIndex + 20, lines.length); i++) {
    const line = lines[i].trim();
    // Look for quoted text or text after colon
    if (line.startsWith('"') || line.includes('": "')) {
      return line.replace(/^[^"]*"/, '').replace(/"[^"]*$/, '');
    }
    // Or just substantial text
    if (line.length > 50 && !line.includes(':')) {
      return line;
    }
  }
  
  return null;
};

/**
 * Generate detailed recommendations using AI
 */
export const generateAIRecommendations = async (postText, analysisScores) => {
  try {
    const model = getModel();
    
    const prompt = `${THREADS_ALGORITHM_KNOWLEDGE}

## POST ANALYSIS:
${JSON.stringify(analysisScores, null, 2)}

## POST TEXT:
"${postText}"

Based on the analysis and CONFIRMED algorithmic weights (Replies=10x, Reposts=8x, Dwell Time=6x, Profile Taps=5x), provide prioritized recommendations.

Return JSON:
{
  "critical": [
    {
      "issue": "Specific problem",
      "action": "Exact fix",
      "impact": "Expected improvement",
      "priority": "CRITICAL"
    }
  ],
  "high": [...],
  "medium": [...],
  "low": [...],
  "templateSuggestions": [
    {
      "template": "Template #X: Name",
      "reason": "Why this template fits",
      "example": "How to apply it"
    }
  ]
}

Prioritize by algorithmic weight: 10x (replies) > 8x (reposts) > 6x (dwell) > 5x (profile taps).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { recommendations: text };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
};

/**
 * Batch analyze multiple posts for comparison
 */
export const batchAnalyzePosts = async (posts) => {
  try {
    const model = getModel();
    
    const postsText = posts.map((p, i) => `Post ${i + 1}:\n"${p}"`).join('\n\n');
    
    const prompt = `${THREADS_ALGORITHM_KNOWLEDGE}

Analyze and compare these posts. Rank them by viral potential and explain why.

${postsText}

Return JSON:
{
  "rankings": [
    {
      "postNumber": 1,
      "viralScore": 0-100,
      "reason": "Why this scored high/low",
      "bestTemplate": "Template #X",
      "keyStrength": "Main strength",
      "keyWeakness": "Main weakness"
    }
  ],
  "bestPractices": ["Pattern 1", "Pattern 2"],
  "commonMistakes": ["Mistake 1", "Mistake 2"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { analysis: text };
  } catch (error) {
    console.error('Error in batch analysis:', error);
    throw error;
  }
};

/**
 * Extract text from PDF (client-side)
 * Note: Requires pdf.js or similar library
 */
export const extractTextFromPDF = async (file) => {
  try {
    // This is a placeholder for PDF extraction
    // In production, you would use pdf.js or a service
    
    // Option 1: Use pdf.js (recommended for client-side)
    // import * as pdfjsLib from 'pdfjs-dist';
    // const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    // let text = '';
    // for (let i = 1; i <= pdf.numPages; i++) {
    //   const page = await pdf.getPage(i);
    //   const content = await page.getTextContent();
    //   text += content.items.map(item => item.str).join(' ');
    // }
    // return text;
    
    // Option 2: Use a service (for production)
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await fetch('/api/extract-pdf', {
    //   method: 'POST',
    //   body: formData
    // });
    // return await response.text();
    
    // Placeholder implementation
    throw new Error('PDF extraction requires pdf.js library. Install with: npm install pdfjs-dist');
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
};

/**
 * Analyze an uploaded reference document (CSV, PDF, etc.)
 */
export const analyzeReferenceDocument = async (text, fileType) => {
  try {
    const model = getModel();
    
    const prompt = `${THREADS_ALGORITHM_KNOWLEDGE}

Extract high-performing post patterns from this ${fileType} document.

Document content:
${text.substring(0, 10000)} ${text.length > 10000 ? '...(truncated)' : ''}

Return JSON:
{
  "posts": [
    {
      "text": "Post text",
      "estimatedScore": 0-100,
      "templates": ["Template #X"],
      "keyPatterns": ["Pattern 1", "Pattern 2"]
    }
  ],
  "insights": ["Insight 1", "Insight 2"],
  "recommendations": "How to apply these patterns"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text_response = response.text();
    
    const jsonMatch = text_response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { analysis: text_response };
  } catch (error) {
    console.error('Error analyzing reference document:', error);
    throw error;
  }
};