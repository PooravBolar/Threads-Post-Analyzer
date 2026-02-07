const IDEAL_LINE_MIN = 20;
const IDEAL_LINE_MAX = 40;
const IDEAL_WHITE_SPACE_MIN = 0.25;
const IDEAL_WHITE_SPACE_MAX = 0.35;

const getLines = (text) => text.split(/\r?\n/);

const wrapLine = (line, maxLength) => {
  if (line.length <= maxLength) return [line];
  const words = line.split(/\s+/);
  const wrapped = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      wrapped.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) wrapped.push(current);
  return wrapped;
};

export const analyzeFormatting = (text) => {
  const lines = getLines(text);
  const textLines = lines.filter((line) => line.trim().length > 0);
  const emptyLines = lines.length - textLines.length;
  const totalLines = lines.length || 1;

  const avgCharsPerLine = textLines.length
    ? Math.round(textLines.reduce((sum, line) => sum + line.length, 0) / textLines.length)
    : 0;

  let lineDensityStatus = 'Balanced';
  let lineDensitySuggestion = 'Line density looks good for scannability.';
  if (avgCharsPerLine > IDEAL_LINE_MAX) {
    lineDensityStatus = 'Too Dense';
    lineDensitySuggestion = 'Break long lines into 1–2 shorter lines.';
  } else if (avgCharsPerLine > 0 && avgCharsPerLine < IDEAL_LINE_MIN) {
    lineDensityStatus = 'Too Sparse';
    lineDensitySuggestion = 'Combine short fragments so lines feel complete.';
  }

  const paragraphs = text.split(/\n\s*\n/).filter((para) => para.trim().length > 0);
  const longParagraphs = paragraphs.filter((para) => {
    const paraLines = para.split(/\r?\n/).filter((line) => line.trim().length > 0);
    return paraLines.length > 3;
  });
  const paragraphStatus = longParagraphs.length > 0 ? 'Needs Chunking' : 'Well Chunked';
  const paragraphSuggestion = longParagraphs.length
    ? 'Keep paragraphs to 1–2 lines for faster scanning.'
    : 'Paragraph rhythm looks strong.';

  const whiteSpaceRatio = Number((emptyLines / totalLines).toFixed(2));
  let whiteSpaceStatus = 'Healthy';
  let whiteSpaceSuggestion = 'Whitespace ratio is in the ideal range.';
  if (whiteSpaceRatio < IDEAL_WHITE_SPACE_MIN) {
    whiteSpaceStatus = 'Too Tight';
    whiteSpaceSuggestion = 'Add empty lines between key points.';
  } else if (whiteSpaceRatio > IDEAL_WHITE_SPACE_MAX) {
    whiteSpaceStatus = 'Too Airy';
    whiteSpaceSuggestion = 'Reduce empty lines to keep momentum.';
  }

  const listPattern = /^(\s*[-*•]|\s*\d+\.)\s+/;
  const hasListPattern = textLines.some((line) => listPattern.test(line));
  const listStatus = hasListPattern ? 'Structured' : 'Unstructured';
  const listSuggestion = hasListPattern
    ? 'List structure detected.'
    : 'Consider a numbered list for clarity.';

  let scrollabilityScore = 10;
  if (lineDensityStatus === 'Too Dense') scrollabilityScore -= 2.2;
  if (lineDensityStatus === 'Too Sparse') scrollabilityScore -= 1.2;
  if (paragraphStatus === 'Needs Chunking') scrollabilityScore -= 2;
  if (whiteSpaceStatus === 'Too Tight') scrollabilityScore -= 2;
  if (whiteSpaceStatus === 'Too Airy') scrollabilityScore -= 0.8;
  if (!hasListPattern) scrollabilityScore -= 1;
  scrollabilityScore = Math.max(0, Math.min(10, Number(scrollabilityScore.toFixed(1))));

  const formatScore = Math.max(
    0,
    Math.min(
      10,
      Number(
        (
          (scrollabilityScore +
            (lineDensityStatus === 'Balanced' ? 10 : 6) +
            (paragraphStatus === 'Well Chunked' ? 10 : 6) +
            (whiteSpaceStatus === 'Healthy' ? 10 : 6) +
            (hasListPattern ? 10 : 6)) /
          5
        ).toFixed(1)
      )
    )
  );

  const issues = [];
  const quickFixes = [];
  if (lineDensityStatus !== 'Balanced') {
    issues.push('Lines are either too long or too choppy.');
    quickFixes.push(lineDensitySuggestion);
  }
  if (paragraphStatus === 'Needs Chunking') {
    issues.push('Paragraphs are too dense.');
    quickFixes.push(paragraphSuggestion);
  }
  if (whiteSpaceStatus !== 'Healthy') {
    issues.push('Whitespace ratio is outside the ideal range.');
    quickFixes.push(whiteSpaceSuggestion);
  }
  if (!hasListPattern) {
    issues.push('No visible structure detected.');
    quickFixes.push(listSuggestion);
  }

  if (issues.length === 0) {
    issues.push('Formatting looks strong for Threads readers.');
    quickFixes.push('Keep this rhythm for future posts.');
  }

  return {
    avgCharsPerLine,
    lineDensityStatus,
    lineDensitySuggestion,
    paragraphStatus,
    paragraphSuggestion,
    longParagraphCount: longParagraphs.length,
    whiteSpaceRatio,
    whiteSpaceStatus,
    whiteSpaceSuggestion,
    listStatus,
    listSuggestion,
    scrollabilityScore,
    formatScore,
    issues,
    quickFixes,
  };
};

export const autoFormatPost = (text) => {
  if (!text.trim()) return text;
  const sanitized = text.replace(/\s+/g, ' ').trim();
  const sentences = sanitized.split(/(?<=[.!?])\s+/);
  const wrappedParagraphs = [];
  for (let i = 0; i < sentences.length; i += 2) {
    const paragraph = sentences.slice(i, i + 2).join(' ');
    const wrappedLines = wrapLine(paragraph, 42);
    wrappedParagraphs.push(wrappedLines.join('\n'));
  }
  return wrappedParagraphs.join('\n\n');
};
