import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db";

export const AI_MODEL = "claude-haiku-4-5-20251001";

// Haiku 4.5 pricing: $1.00 / 1M input, $5.00 / 1M output
const PRICE_INPUT_PER_TOKEN = 1.0 / 1_000_000;
const PRICE_OUTPUT_PER_TOKEN = 5.0 / 1_000_000;

export function estimateCost(inputTokens: number, outputTokens: number): number {
  return (
    inputTokens * PRICE_INPUT_PER_TOKEN +
    outputTokens * PRICE_OUTPUT_PER_TOKEN
  );
}

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

if (process.env.NODE_ENV !== "production")
  globalForAnthropic.anthropic = anthropic;

export async function saveTokenUsage(
  userId: string,
  endpoint: string,
  inputTokens: number,
  outputTokens: number
) {
  try {
    await prisma.tokenUsage.create({
      data: { userId, endpoint, inputTokens, outputTokens },
    });
  } catch {
    // non-critical
  }
}
