export type WordStatus = "correct" | "wrong" | "missed" | "extra" | "pending";

export interface WordResult {
  word: string;
  status: WordStatus;
  transcribedWord?: string;
}

export interface ComparisonResult {
  words: WordResult[];
  score: number;
  correctCount: number;
  totalCount: number;
}

const CONTRACTIONS: Record<string, string> = {
  "don't": "dont", "doesn't": "doesnt", "didn't": "didnt",
  "won't": "wont", "wouldn't": "wouldnt", "shouldn't": "shouldnt",
  "couldn't": "couldnt", "can't": "cant", "isn't": "isnt",
  "aren't": "arent", "wasn't": "wasnt", "weren't": "werent",
  "i'm": "im", "i've": "ive", "i'll": "ill", "i'd": "id",
  "it's": "its", "that's": "thats", "there's": "theres",
  "they're": "theyre", "they've": "theyve", "they'll": "theyll",
  "you're": "youre", "you've": "youve", "you'll": "youll",
  "we're": "were", "we've": "weve", "we'll": "well",
  "he's": "hes", "she's": "shes", "let's": "lets",
};

// STT often transcribes spoken numbers as digits — normalize digits → words
const NUMBERS: Record<string, string> = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
  "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
  "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen",
  "14": "fourteen", "15": "fifteen", "16": "sixteen", "17": "seventeen",
  "18": "eighteen", "19": "nineteen", "20": "twenty", "30": "thirty",
  "40": "forty", "50": "fifty", "60": "sixty", "70": "seventy",
  "80": "eighty", "90": "ninety", "100": "hundred",
  // time formats: 7:00 → seven, 7:30 → seven thirty
};

function normalizeNumbers(text: string): string {
  // Replace time like "7:00" → "seven" or "7:30" → "seven thirty"
  text = text.replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, m) => {
    const hour = NUMBERS[h] ?? h;
    const min = m === "00" ? "" : " " + (NUMBERS[m] ?? m);
    return (hour + min).trim();
  });
  // Replace standalone numbers
  text = text.replace(/\b(\d+)\b/g, (_, n) => NUMBERS[n] ?? n);
  return text;
}

export function normalizeText(text: string): string {
  let result = text.toLowerCase();
  // Numbers before contractions so "7:00" → "seven" not "seven:00"
  result = normalizeNumbers(result);
  for (const [c, e] of Object.entries(CONTRACTIONS)) {
    result = result.replace(new RegExp(c, "gi"), e);
  }
  result = result.replace(/[.,!?;:'"()\-–—]/g, "");
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function isMatch(a: string, b: string): boolean {
  if (a === b) return true;
  // Allow 1 edit for short words (< 5 chars), 2 edits for longer
  const maxDist = Math.max(a.length, b.length) >= 5 ? 2 : 1;
  return levenshteinDistance(a, b) <= maxDist;
}

/**
 * Sequential greedy alignment — suited for reading exercises where words
 * are expected in order. We walk both arrays together and use a small
 * lookahead to skip over genuinely missed words.
 */
export function compareTexts(
  original: string,
  transcribed: string
): ComparisonResult {
  const origNorm = normalizeText(original).split(" ").filter(Boolean);
  const transcNorm = normalizeText(transcribed).split(" ").filter(Boolean);
  const rawOrig = original.split(/\s+/).filter(Boolean);

  // Start with every passage word as "pending"
  const result: WordResult[] = rawOrig.map((w) => ({ word: w, status: "pending" }));

  const LOOKAHEAD_ORIG = 2;  // max words user can skip at once
  const LOOKAHEAD_TRANS = 3; // look ahead in transcript (STT inserted noise words)
  let origIdx = 0;
  let transcIdx = 0;

  while (transcIdx < transcNorm.length && origIdx < origNorm.length) {
    const tw = transcNorm[transcIdx];

    // 1. Exact/fuzzy match at current position
    if (isMatch(origNorm[origIdx], tw)) {
      result[origIdx].status = "correct";
      origIdx++;
      transcIdx++;
      continue;
    }

    // 2. Look ahead in passage — user skipped some words
    let missedAhead = -1;
    for (let la = 1; la <= LOOKAHEAD_ORIG && origIdx + la < origNorm.length; la++) {
      if (isMatch(origNorm[origIdx + la], tw)) {
        missedAhead = la;
        break;
      }
    }
    if (missedAhead > 0) {
      for (let k = 0; k < missedAhead; k++) {
        result[origIdx + k].status = "missed";
      }
      result[origIdx + missedAhead].status = "correct";
      origIdx += missedAhead + 1;
      transcIdx++;
      continue;
    }

    // 3. Look ahead in transcript — STT inserted noise words, skip them
    let noiseAhead = -1;
    for (let la = 1; la <= LOOKAHEAD_TRANS && transcIdx + la < transcNorm.length; la++) {
      if (isMatch(origNorm[origIdx], transcNorm[transcIdx + la])) {
        noiseAhead = la;
        break;
      }
    }
    if (noiseAhead > 0) {
      // skip noise words in transcript, don't penalize passage word
      transcIdx += noiseAhead;
      continue;
    }

    // 4. No match found — mark current passage word as wrong, advance both
    result[origIdx].status = "wrong";
    result[origIdx].transcribedWord = tw;
    origIdx++;
    transcIdx++;
  }

  // Everything from origIdx onwards stays "pending" (not yet read)

  const correctCount = result.filter((r) => r.status === "correct").length;
  const totalCount   = result.filter((r) => r.status !== "pending").length;
  const score = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

  console.log(`[compare] frontier=${origIdx}/${origNorm.length}, correct=${correctCount}, wrong=${result.filter(r=>r.status==="wrong").length}, missed=${result.filter(r=>r.status==="missed").length}, pending=${result.filter(r=>r.status==="pending").length}`);

  return { words: result, score, correctCount, totalCount };
}
