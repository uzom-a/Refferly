import Sentiment from "sentiment";

const sentiment = new Sentiment();

export interface SentimentResult {
  score: number; // -5 to 5
  comparative: number; // -1 to 1
  calculation: Array<{ [key: string]: number }>;
  tokens: string[];
  words: string[];
  positive: string[];
  negative: string[];
}

/**
 * Calculate sentiment score from review text
 * Returns a normalized score between 0 and 1
 * 0 = very negative, 1 = very positive
 */
export function calculateSentiment(text: string): number {
  const result = sentiment.analyze(text);
  
  // Normalize the comparative score (-1 to 1) to (0 to 1)
  // comparative: -1 (very negative) to 1 (very positive)
  const normalized = (result.comparative + 1) / 2;
  
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Calculate overall rating from individual category ratings
 * Returns average of all ratings normalized to 0-1 scale
 */
export function calculateOverallRating(ratings: {
  punctuality: number;
  communication: number;
  pricingFairness: number;
  skill: number;
}): number {
  const average = (
    ratings.punctuality +
    ratings.communication +
    ratings.pricingFairness +
    ratings.skill
  ) / 4;
  
  // Normalize from 1-5 scale to 0-1 scale
  return (average - 1) / 4;
}

