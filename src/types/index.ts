export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  detectedSpeech?: string;
  pronunciationScore?: number;
}

export interface ScenarioContext {
  characterName: string;
  characterDescription: string;
  openingLine: string;
  level: string;
  topic: string;
  sessionId: string;
}

export interface UserSettings {
  currentLevel: string;
  preferredTopics: string[];
}
