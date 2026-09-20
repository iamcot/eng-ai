export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Level = (typeof LEVELS)[number];

export const READING_TOPICS = [
  "daily life",
  "travel",
  "food and cooking",
  "technology",
  "sports",
  "nature and environment",
  "health and fitness",
  "work and career",
  "family and relationships",
  "culture and traditions",
] as const;

export const CONVERSATION_TOPICS = [
  "at a restaurant",
  "job interview",
  "shopping at a store",
  "at the doctor",
  "asking for directions",
  "making hotel reservations",
  "at the airport",
  "meeting new people",
  "discussing hobbies",
  "at a coffee shop",
] as const;

const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  A1: "absolute beginner — simple words, present tense, very short sentences, familiar topics like family and numbers",
  A2: "elementary — basic vocabulary, simple grammar, familiar everyday topics",
  B1: "intermediate — everyday language, some complex sentences, common idiomatic phrases",
  B2: "upper-intermediate — range of topics, idiomatic expressions, nuanced vocabulary",
  C1: "advanced — complex language, sophisticated style, academic and professional vocabulary",
  C2: "proficient — near-native, complex and idiomatic, any topic with precision",
};

export function buildPassagePrompt(
  level: Level,
  topic: string
): { system: string; user: string } {
  return {
    system: `You are an English language teaching assistant creating reading passages for pronunciation practice.
The learner is at ${level} level (${LEVEL_DESCRIPTIONS[level]}).
Requirements:
- Length: exactly 50-80 words
- Use natural, flowing prose (not a list)
- Vocabulary and grammar must match the ${level} level exactly
- Avoid rare words or very unusual proper nouns (hard to pronounce)
- No title, no headings, no labels — return ONLY the passage text`,
    user: `Write a ${level}-level English reading passage about: ${topic}`,
  };
}

export interface ScenarioResponse {
  characterName: string;
  characterDescription: string;
  openingLine: string;
}

export function buildScenarioPrompt(
  level: Level,
  topic: string
): { system: string; user: string } {
  return {
    system: `You are helping create an English conversation practice scenario for a ${level} learner (${LEVEL_DESCRIPTIONS[level]}).
Respond with valid JSON only, exactly in this format:
{
  "characterName": "a natural English name",
  "characterDescription": "1-2 sentences describing the character and their role in this scenario",
  "openingLine": "what the character says to start the conversation, appropriate for ${level} level"
}`,
    user: `Create a conversation scenario: "${topic}". Keep language appropriate for ${level} level English learners.`,
  };
}

export function buildConversationSystemPrompt(
  level: Level,
  topic: string,
  characterName: string,
  characterDescription: string
): string {
  return `You are roleplaying as ${characterName}: ${characterDescription}
You are having a "${topic}" conversation with an English language learner at ${level} level (${LEVEL_DESCRIPTIONS[level]}).
Rules:
- Keep ALL your language at ${level} level — appropriate vocabulary and sentence complexity
- Responses must be 2-4 sentences maximum to keep the conversation moving
- Stay completely in character — never break the roleplay
- Never comment on their English ability or pronunciation
- Be natural and encouraging through the character's personality
- Continue the conversation naturally based on what they say`;
}

export function trimConversationHistory(
  history: { role: "user" | "assistant"; content: string }[],
  maxTurns = 10
): { role: "user" | "assistant"; content: string }[] {
  // Keep last maxTurns * 2 messages (each turn = 1 user + 1 assistant)
  return history.slice(-(maxTurns * 2));
}

export function buildVocabExamplePrompt(
  word: string,
  level: Level
): { system: string; user: string } {
  return {
    system: `You are an English teacher creating example sentences for vocabulary practice.
Write a single natural sentence (10-20 words) using the given word, appropriate for ${level} level (${LEVEL_DESCRIPTIONS[level]}).
Return ONLY the sentence — no markdown, no quotes, no explanation.`,
    user: `Write an example sentence using the word: ${word}`,
  };
}
