export interface SRResult {
  newInterval: number;
  newEaseFactor: number;
  nextReviewAt: Date;
}

const MIN_EASE = 1.3;

export function applySM2(
  correct: boolean,
  interval: number,
  easeFactor: number
): SRResult {
  let newInterval: number;
  let newEaseFactor: number;

  if (correct) {
    newInterval = Math.max(1, Math.round(interval * easeFactor));
    newEaseFactor = Math.min(3.0, easeFactor + 0.1);
  } else {
    newInterval = 1;
    newEaseFactor = Math.max(MIN_EASE, easeFactor - 0.2);
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return { newInterval, newEaseFactor, nextReviewAt };
}
