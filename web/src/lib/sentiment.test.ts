import { describe, it, expect } from "vitest";
import { calculateSentiment, calculateOverallRating } from "./sentiment";

describe("calculateSentiment", () => {
  it("returns a high score for clearly positive text", () => {
    const score = calculateSentiment(
      "This worker was amazing, professional, and did excellent work. Highly recommend!",
    );
    expect(score).toBeGreaterThan(0.5);
  });

  it("returns a low score for clearly negative text", () => {
    const score = calculateSentiment(
      "Terrible experience. Rude, late, and did a horrible, sloppy job.",
    );
    expect(score).toBeLessThan(0.5);
  });

  it("returns a score around the midpoint for neutral text", () => {
    const score = calculateSentiment("The worker arrived and completed the job.");
    expect(score).toBeGreaterThanOrEqual(0.4);
    expect(score).toBeLessThanOrEqual(0.6);
  });

  it("handles empty strings without throwing", () => {
    expect(() => calculateSentiment("")).not.toThrow();
    const score = calculateSentiment("");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("always returns a value clamped between 0 and 1", () => {
    const extremelyPositive = calculateSentiment(
      "Amazing wonderful fantastic excellent perfect brilliant outstanding superb great love love love",
    );
    const extremelyNegative = calculateSentiment(
      "Terrible awful horrible disgusting worst hate hate hate bad bad bad rude",
    );
    expect(extremelyPositive).toBeLessThanOrEqual(1);
    expect(extremelyPositive).toBeGreaterThanOrEqual(0);
    expect(extremelyNegative).toBeLessThanOrEqual(1);
    expect(extremelyNegative).toBeGreaterThanOrEqual(0);
  });

  it("scores positive text higher than negative text", () => {
    const positive = calculateSentiment("Great job, very happy with the work.");
    const negative = calculateSentiment("Bad job, very unhappy with the work.");
    expect(positive).toBeGreaterThan(negative);
  });
});

describe("calculateOverallRating", () => {
  it("returns 1 when all ratings are the maximum (5)", () => {
    const result = calculateOverallRating({
      punctuality: 5,
      communication: 5,
      pricingFairness: 5,
      skill: 5,
    });
    expect(result).toBe(1);
  });

  it("returns 0 when all ratings are the minimum (1)", () => {
    const result = calculateOverallRating({
      punctuality: 1,
      communication: 1,
      pricingFairness: 1,
      skill: 1,
    });
    expect(result).toBe(0);
  });

  it("returns 0.5 when all ratings are at the midpoint (3)", () => {
    const result = calculateOverallRating({
      punctuality: 3,
      communication: 3,
      pricingFairness: 3,
      skill: 3,
    });
    expect(result).toBeCloseTo(0.5);
  });

  it("averages mixed ratings correctly", () => {
    // average = (5 + 3 + 1 + 5) / 4 = 3.5 -> (3.5 - 1) / 4 = 0.625
    const result = calculateOverallRating({
      punctuality: 5,
      communication: 3,
      pricingFairness: 1,
      skill: 5,
    });
    expect(result).toBeCloseTo(0.625);
  });
});
