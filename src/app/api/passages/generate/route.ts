import { auth } from "@/lib/auth";
import { anthropic, AI_MODEL, saveTokenUsage } from "@/lib/anthropic";
import { buildPassagePrompt, LEVELS, type Level } from "@/lib/prompts";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { level, topic } = await req.json();

    if (!LEVELS.includes(level as Level)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // 1. Try to find an unused passage from the pool
    const poolPassage = await prisma.passage.findFirst({
      where: {
        level,
        topic,
        attempts: { none: { userId } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (poolPassage) {
      console.log(`[Passages] pool hit: ${poolPassage.id}`);
      return NextResponse.json({
        passage: poolPassage.text,
        passageId: poolPassage.id,
        fromPool: true,
      });
    }

    // 2. Pool exhausted — generate via AI
    console.log("[Passages] pool miss, generating via AI");
    const { system, user } = buildPassagePrompt(level as Level, topic);

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 256,
      system,
      messages: [{ role: "user", content: user }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
    // Strip markdown headings (e.g. "# Title\n\n") that Claude sometimes adds
    const text = raw.replace(/^#+\s+[^\n]*\n+/, "").trim();

    await saveTokenUsage(userId, "passages/generate", message.usage.input_tokens, message.usage.output_tokens);

    // 3. Save to pool
    const newPassage = await prisma.passage.create({
      data: { text, level, topic },
    });

    return NextResponse.json({
      passage: text,
      passageId: newPassage.id,
      fromPool: false,
    });
  } catch (error) {
    console.error("Passage generation error:", error);
    return NextResponse.json({ error: "Failed to generate passage" }, { status: 500 });
  }
}
