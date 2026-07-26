import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { anthropic, AI_MODEL, saveTokenUsage } from "@/lib/anthropic";
import { buildVocabExamplePrompt, LEVELS, type Level } from "@/lib/prompts";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const word = searchParams.get("word");
  const level = (searchParams.get("level") ?? "B1") as Level;

  if (!word) return NextResponse.json({ error: "word required" }, { status: 400 });
  if (!LEVELS.includes(level)) return NextResponse.json({ error: "invalid level" }, { status: 400 });

  // Return cached sentence if available
  const vocabWord = await prisma.vocabWord.findFirst({
    where: { userId: session.user.id, word: word.toLowerCase() },
  });
  if (vocabWord?.exampleSentence) {
    return NextResponse.json({ sentence: vocabWord.exampleSentence });
  }

  // Generate via AI
  try {
    const { system, user } = buildVocabExamplePrompt(word, level);
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 128,
      system,
      messages: [{ role: "user", content: user }],
    });

    const sentence =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    await saveTokenUsage(session.user.id, "vocab/example", message.usage.input_tokens, message.usage.output_tokens);

    // Cache the sentence
    if (vocabWord && sentence) {
      await prisma.vocabWord.update({
        where: { id: vocabWord.id },
        data: { exampleSentence: sentence },
      });
    }

    return NextResponse.json({ sentence });
  } catch {
    return NextResponse.json({ error: "Failed to generate example" }, { status: 500 });
  }
}
