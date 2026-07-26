import { auth } from "@/lib/auth";
import { anthropic, AI_MODEL, saveTokenUsage } from "@/lib/anthropic";
import { buildScenarioPrompt, LEVELS, type Level } from "@/lib/prompts";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { level, topic } = await req.json();

    if (!LEVELS.includes(level as Level)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const { system, user } = buildScenarioPrompt(level as Level, topic);

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      system,
      messages: [{ role: "user", content: user }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text.trim() : "{}";

    // Parse JSON response from Claude
    let scenario: {
      characterName: string;
      characterDescription: string;
      openingLine: string;
    };
    try {
      // Claude sometimes wraps JSON in markdown code blocks
      const cleaned = responseText.replace(/```json\n?|\n?```/g, "").trim();
      scenario = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse scenario" },
        { status: 500 }
      );
    }

    await saveTokenUsage(
      session.user.id,
      "conversation/start",
      message.usage.input_tokens,
      message.usage.output_tokens
    );

    // Create session in DB
    const exerciseSession = await prisma.exerciseSession.create({
      data: {
        userId: session.user.id,
        type: "CONVERSATION",
        level,
        topic,
      },
    });

    // Save opening line as first assistant turn
    await prisma.conversationTurn.create({
      data: {
        sessionId: exerciseSession.id,
        role: "ASSISTANT",
        content: scenario.openingLine,
      },
    });

    return NextResponse.json({
      sessionId: exerciseSession.id,
      characterName: scenario.characterName,
      characterDescription: scenario.characterDescription,
      openingLine: scenario.openingLine,
      level,
      topic,
    });
  } catch (error) {
    console.error("Conversation start error:", error);
    return NextResponse.json(
      { error: "Failed to start conversation" },
      { status: 500 }
    );
  }
}
