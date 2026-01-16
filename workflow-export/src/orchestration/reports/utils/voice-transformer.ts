/**
 * Voice transformation utilities for Owner's Report
 *
 * ✅ DO apply to:
 *    - Narrative paragraphs
 *    - Finding descriptions
 *    - Recommendation explanations
 *    - Section introductory text
 *
 * ❌ DO NOT apply to:
 *    - Section headers/titles
 *    - Metric labels
 *    - Table headers
 *    - Button/action text
 *    - Proper nouns or company names
 */

/**
 * Transform third-person analytical voice to owner-focused voice
 */
export function transformToOwnerVoice(text: string): string {
  if (!text) return '';

  const transformations: [RegExp, string][] = [
    // Company references → You/Your
    [/\bThe company\b/gi, 'Your business'],
    [/\bThe organization\b/gi, 'Your organization'],
    [/\bThe business\b/gi, 'Your business'],
    [/\bThe firm\b/gi, 'Your firm'],

    // Third person → Second person
    [/\bIt should\b/gi, 'You should'],
    [/\bIt is recommended\b/gi, 'We recommend you'],
    [/\bIt would be beneficial\b/gi, 'You would benefit from'],
    [/\bRecommendations include\b/gi, 'We recommend'],
    [/\bThis indicates\b/gi, 'This means you'],
    [/\bThis suggests\b/gi, 'This means you should'],

    // Passive → Active owner-focused
    [/\bshould be prioritized\b/gi, 'should be your priority'],
    [/\bneeds to be addressed\b/gi, 'you need to address'],
    [/\brequires attention\b/gi, 'needs your attention'],
    [/\bshould be implemented\b/gi, 'you should implement'],
    [/\bmust be considered\b/gi, 'you must consider'],

    // Analysis language → Advisory language
    [/\bAnalysis indicates that\b/gi, 'This means'],
    [/\bFindings suggest\b/gi, 'You should know that'],
    [/\bData shows\b/gi, 'Your data shows'],
    [/\bResults indicate\b/gi, 'Your results show'],
    [/\bAssessment reveals\b/gi, 'Your assessment shows'],

    // Organizational references
    [/\bThe leadership team\b/gi, 'Your leadership team'],
    [/\bThe management\b/gi, 'Your management'],
    [/\bThe staff\b/gi, 'Your staff'],
    [/\bThe employees\b/gi, 'Your employees'],
    [/\bThe workforce\b/gi, 'Your workforce']
  ];

  let result = text;
  for (const [pattern, replacement] of transformations) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Check if text is likely a header/title (should NOT be transformed)
 */
export function isLikelyHeader(text: string): boolean {
  if (!text) return false;
  if (text.length > 100) return false;

  const headerPatterns = [
    /^Chapter \d/i,
    /^Section \d/i,
    /^Phase \d/i,
    /^Step \d/i,
    /Deep Dive$/i,
    /Overview$/i,
    /Summary$/i,
    /Assessment$/i,
    /Analysis$/i,
  ];

  return headerPatterns.some(pattern => pattern.test(text));
}

/**
 * Safe wrapper that only transforms if text appears to be narrative
 */
export function safeTransformToOwnerVoice(text: string): string {
  if (!text) return '';
  if (isLikelyHeader(text)) return text;
  if (text.split(/\s+/).length < 5) return text;
  return transformToOwnerVoice(text);
}

/**
 * Truncate text to a maximum number of sentences
 */
export function truncateToSentences(text: string, maxSentences: number): string {
  if (!text) return '';
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= maxSentences) return text;
  return sentences.slice(0, maxSentences).join(' ').trim();
}

/**
 * Truncate text to a maximum number of words
 */
export function truncateToWords(text: string, maxWords: number): string {
  if (!text) return '';
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}
