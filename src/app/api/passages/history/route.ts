import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempts = await prisma.readingAttempt.findMany({
    where: { userId: session.user.id },
    orderBy: { completedAt: "desc" },
    take: 100,
    include: {
      passage: { select: { id: true, text: true, level: true, topic: true } },
    },
  });

  // Group by passageId — latest attempt first within each group
  const passageMap = new Map<string, {
    passageId: string;
    passage: string;
    level: string;
    topic: string;
    latestScore: number;
    bestScore: number;
    completedAt: number;
    attempts: { id: string; score: number; completedAt: number; resultJson: string | null }[];
  }>();

  for (const a of attempts) {
    const pid = a.passageId;
    if (!passageMap.has(pid)) {
      passageMap.set(pid, {
        passageId: pid,
        passage: a.passage.text,
        level: a.passage.level,
        topic: a.passage.topic,
        latestScore: a.score,
        bestScore: a.score,
        completedAt: a.completedAt.getTime(),
        attempts: [],
      });
    }
    const entry = passageMap.get(pid)!;
    entry.bestScore = Math.max(entry.bestScore, a.score);
    entry.attempts.push({
      id: a.id,
      score: a.score,
      completedAt: a.completedAt.getTime(),
      resultJson: a.resultJson,
    });
  }

  return NextResponse.json({ history: Array.from(passageMap.values()) });
}
