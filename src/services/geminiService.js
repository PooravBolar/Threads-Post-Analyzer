import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file');
}

// Allow overriding the model from .env so you can use
// whatever model ID your account actually has access to.
// Example values (depending on your account / docs):
// - 'gemini-pro'
// - 'gemini-1.0-pro'
// - 'gemini-1.5-pro'
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
 * Analyze post using Gemini AI with reference database
 */
export const analyzePostWithContext = async (postText, referenceData) => {
  try {
    const model = getModel();
    
    const referenceContext = referenceData
      ? `\n\nReference Database:\n${JSON.stringify(referenceData, null, 2)}`
      : '';

    const prompt = `You are an expert social media analyst specializing in Threads posts. Analyze the following post and provide a detailed analysis based on these metrics:

1. Engagement Potential (0-100): How likely is this post to generate likes, comments, and shares?
2. Readability Score (0-100): How easy is it to read and understand?
3. Sentiment Score (0-100): Positive sentiment (higher is better)
4. Hook Strength (0-100): How compelling is the opening?
5. Call-to-Action Quality (0-100): How clear and effective is the CTA?
6. Visual Appeal (0-100): How well does the text create visual interest?
7. Authenticity (0-100): How genuine and authentic does it sound?
8. Viral Potential (0-100): Overall likelihood to go viral

${referenceContext}

Post to analyze:
"${postText}"

Provide your analysis in JSON format with scores for each metric and brief explanations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { analysis: text, scores: {} };
  } catch (error) {
    console.error('Error analyzing post:', error);
    throw error;
  }
};

/**
 * Enhance post using Gemini AI with reference database
 */
export const enhancePostWithContext = async (postText, referenceData, analysisScores) => {
  try {
    if (!genAI) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const model = getModel();
    
    // Format reference data properly
    let referenceContext = '';
    if (referenceData && referenceData.length > 0) {
      const formattedRefs = referenceData
        .filter(ref => ref && (typeof ref === 'string' || ref.postText))
        .map((ref, idx) => {
          const text = typeof ref === 'string' ? ref : (ref.postText || JSON.stringify(ref));
          return `Reference ${idx + 1}:\n${text}`;
        })
        .slice(0, 10); // Limit to 10 most recent
      
      if (formattedRefs.length > 0) {
        referenceContext = `\n\nIMPORTANT: Use these viral posts and reference materials as your primary guide for enhancement:\n${formattedRefs.join('\n\n')}\n\nYour enhancements should follow the style, structure, and patterns found in these references.`;
      }
    }

    const analysisContext = analysisScores
      ? `\n\nCurrent Post Analysis:\n${JSON.stringify(analysisScores, null, 2)}\n\nFocus on improving the metrics with lower scores.`
      : '';

    const prompt = `You are an expert social media copywriter specializing in creating viral Threads posts. Enhance the following post to maximize engagement and viral potential.

${referenceContext}

${analysisContext}

Original Post:
"${postText}"

Provide 3 enhanced versions:
1. A subtle enhancement (keeping most of the original)
2. A moderate enhancement (significant improvements while maintaining voice)
3. A complete rewrite (maximum viral potential)

For each version, explain what you changed and why. Format your response as JSON with keys: "subtle", "moderate", "complete", and "explanations". The explanations should be an object with keys "subtle", "moderate", and "complete" containing the explanation text for each version.

Example format:
{
  "subtle": "Enhanced post text here...",
  "moderate": "Enhanced post text here...",
  "complete": "Enhanced post text here...",
  "explanations": {
    "subtle": "What changed in subtle version",
    "moderate": "What changed in moderate version",
    "complete": "What changed in complete version"
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate structure
        if (parsed.subtle && parsed.moderate && parsed.complete) {
          return parsed;
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON, using fallback:', parseError);
      }
    }
    
    // Fallback: return structured response even if JSON parsing failed
    return {
      subtle: text.split('\n').slice(0, 5).join('\n') || postText,
      moderate: text.split('\n').slice(5, 10).join('\n') || postText,
      complete: text || postText,
      explanations: {
        subtle: 'Subtle enhancement applied',
        moderate: 'Moderate enhancement applied',
        complete: 'Complete rewrite applied'
      }
    };
  } catch (error) {
    console.error('Error enhancing post:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('API key')) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    } else if (error.message?.includes('quota') || error.message?.includes('429')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message?.includes('safety')) {
      throw new Error('Content was blocked by safety filters. Please modify your post.');
    } else if (error.message) {
      throw new Error(`Enhancement failed: ${error.message}`);
    } else {
      throw new Error('Failed to enhance post. Please check your Gemini API key and try again.');
    }
  }
};

/**
 * Extract text from PDF (client-side)
 */
export const extractTextFromPDF = async (file) => {
  try {
    // Note: pdf-parse requires Node.js environment
    // For client-side, we'll need to use a different approach
    // This is a placeholder - you may need to use a service or convert PDFs server-side
    const formData = new FormData();
    formData.append('pdf', file);
    
    // For now, return a placeholder
    // In production, you'd use a PDF parsing service or convert PDFs to text server-side
    return 'PDF text extraction - implement based on your needs';
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
};
