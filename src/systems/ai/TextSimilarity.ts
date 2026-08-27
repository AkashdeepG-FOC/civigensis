/**
 * Text Similarity & Repetition Detection Layer for CiviGenis Autonomous Dialogue
 */

export class TextSimilarity {
  /**
   * Normalize text for accurate semantic/token comparison
   */
  public static normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Combined text similarity ratio (0.0 to 1.0)
   */
  public static similarity(textA: string, textB: string): number {
    return Math.max(this.jaccardSimilarity(textA, textB), this.levenshteinSimilarity(textA, textB));
  }

  /**
   * Token-based Jaccard similarity coefficient (0.0 to 1.0)
   */
  public static jaccardSimilarity(textA: string, textB: string): number {
    const normA = this.normalizeText(textA);
    const normB = this.normalizeText(textB);
    if (!normA || !normB) return 0;
    if (normA === normB) return 1.0;

    const setA = new Set(normA.split(' '));
    const setB = new Set(normB.split(' '));

    let intersectionCount = 0;
    setA.forEach((token) => {
      if (setB.has(token)) intersectionCount++;
    });

    const unionCount = new Set([...setA, ...setB]).size;
    return unionCount === 0 ? 0 : intersectionCount / unionCount;
  }

  /**
   * Levenshtein edit distance similarity ratio (0.0 to 1.0)
   */
  public static levenshteinSimilarity(textA: string, textB: string): number {
    const normA = this.normalizeText(textA);
    const normB = this.normalizeText(textB);
    if (normA === normB) return 1.0;
    if (!normA || !normB) return 0;

    const lenA = normA.length;
    const lenB = normB.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= lenB; i++) matrix[i] = [i];
    for (let j = 0; j <= lenA; j++) matrix[0][j] = j;

    for (let i = 1; i <= lenB; i++) {
      for (let j = 1; j <= lenA; j++) {
        if (normB.charAt(i - 1) === normA.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            )
          );
        }
      }
    }

    const editDistance = matrix[lenB][lenA];
    const maxLen = Math.max(lenA, lenB);
    return maxLen === 0 ? 1.0 : 1.0 - editDistance / maxLen;
  }

  /**
   * Checks if a proposed message is repetitive compared to recent conversation messages
   */
  public static isRepetitiveMessage(
    newMessage: string,
    previousMessages: string[],
    similarityThreshold: number = 0.62
  ): { isRepetitive: boolean; reason?: string; matchedText?: string } {
    const normNew = this.normalizeText(newMessage);
    if (!normNew) return { isRepetitive: true, reason: 'Empty message' };

    // Common generic repeated patterns
    const genericQuestionPatterns = [
      'how is work going',
      'how are things going',
      'how are things on your side',
      'how are you doing today',
      'hope you are having a good day',
      'good day julie',
      'good day ben',
    ];

    // Check if new message matches a generic greeting/question when history already has conversation
    if (previousMessages.length >= 2) {
      for (const pattern of genericQuestionPatterns) {
        if (normNew.includes(pattern)) {
          return {
            isRepetitive: true,
            reason: `Repeated generic phrase/greeting: "${pattern}"`,
          };
        }
      }
    }

    // Compare against previous 6-10 conversation messages
    for (const prev of previousMessages) {
      const normPrev = this.normalizeText(prev);
      if (!normPrev) continue;

      if (normNew === normPrev) {
        return {
          isRepetitive: true,
          reason: 'Exact duplicate of previous message',
          matchedText: prev,
        };
      }

      const jaccard = this.jaccardSimilarity(normNew, normPrev);
      const levenshtein = this.levenshteinSimilarity(normNew, normPrev);
      const simScore = Math.max(jaccard, levenshtein);

      if (simScore >= similarityThreshold) {
        return {
          isRepetitive: true,
          reason: `High semantic similarity score (${(simScore * 100).toFixed(0)}%)`,
          matchedText: prev,
        };
      }
    }

    return { isRepetitive: false };
  }
}
